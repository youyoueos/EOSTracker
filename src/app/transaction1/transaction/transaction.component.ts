import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EosService } from '../../services/eos.service';
import { TransactionService } from '../../services/transaction.service';
import { Action } from '../../models/Action';
import { Transaction } from '../../models/Transaction';
import { Observable, combineLatest, from } from 'rxjs';
import { switchMap, map, share } from 'rxjs/operators';

interface TransactionRaw extends Transaction {
  raw: any;
}

@Component({
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.css']
})
export class TransactionComponent implements OnInit {

  id$: Observable<string>;
  transaction$: Observable<TransactionRaw>;
  transactionActions$: Observable<Action[]>;
  actionsColumns = [
    'id',
    'authorizations',
    'account',
    'name'
  ];

  constructor(
    private route: ActivatedRoute,
    private eosService: EosService,
    private transactionService: TransactionService
  ) { }

  ngOnInit() {
    this.id$ = this.route.params.pipe(
      map(params => params.id)
    );
    this.transaction$ = this.id$.pipe(
      switchMap(id => this.transactionService.getTransaction(id)),
      switchMap(transaction => {
        return from(this.eosService.eos.getBlock(transaction.blockId)).pipe(
          map((block: any) => {
            const raw = block.transactions.find(t => t.trx.id === transaction.id);
            return { ...transaction, raw };
          })
        );
      }),
      share()
    );
    this.transactionActions$ = combineLatest(
      this.id$,
      this.route.queryParams
    ).pipe(
      switchMap(([id, queryParams]) => {
        return this.transactionService.getTransactionActions(id, queryParams.page);
      })
    );
  }

}
