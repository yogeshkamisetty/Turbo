import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap, finalize } from 'rxjs/operators';
import { DataSource } from 'typeorm';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(private dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const queryRunner = this.dataSource.createQueryRunner();

    return from(queryRunner.connect()).pipe(
      mergeMap(() => from(queryRunner.startTransaction())),
      mergeMap(() => {
        if (user && user.tenantId) {
          // Use set_config with parameterization inside transaction
          return from(queryRunner.query(`SELECT set_config('app.tenant_id', $1, true)`, [user.tenantId]));
        }
        return from(Promise.resolve());
      }),
      mergeMap(() => {
        // Attach queryRunner manager to request for transactional execution
        request.transactionalEntityManager = queryRunner.manager;
        return next.handle();
      }),
      mergeMap((result) => from(queryRunner.commitTransaction()).pipe(mergeMap(() => from(Promise.resolve(result))))),
      finalize(async () => {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        await queryRunner.release();
      })
    );
  }
}
