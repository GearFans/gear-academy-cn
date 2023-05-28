## 第 5 课：在智能合约中实现拍卖功能

### 课程总结

- 本课提供了在 Tamagotchi 拍卖合约中实施英式拍卖模型的分步指南。

- 我们将介绍自动程序执行以促进英式拍卖模型

- 我们将突出显示拍卖功能所需的合同状态和逻辑

- 期待拍卖功能解决方案的动手开发

### 课程目标

在本课结束时，你将：

- 通过智能合约自动化理解自动程序执行

- 理解实现拍卖功能时的智能合约状态和逻辑

- 了解系统信号、gas 预留以及如何将 gas 预留添加到系统信号

- 将拍卖模型纳入你的智能合约

### 让我们开始吧！

在本课中，我们将创建一个合约，用户可以在其中拍卖他们的 Tamagotchi。我们实施英式拍卖模型吧。

这种类型的拍卖以电子宠物所有者设定的最低出价声明开始。在此之后，有兴趣的投标人开始按升序排列他们的投标，即下一个投标应高于前一个。这个过程一直持续到出价高于该价格时其他买家都没有兴趣购买 Tamagotchi。最高出价是 Tamagotchi 的售价。

正如你可能猜到的那样，你的 Tamagotchi 约应该扩展为可以更改所有权的功能（这正是上一课的作业）。

拍卖期间，拍卖合约暂时成为 Tamagotchi 的主人。拍卖结束后，合约会指定 Tamagotchi 的新主人 —— 拍卖的赢家。如果没有人出价，Tamagotchi 将退还给之前的所有者。

### 通过智能合约自动化自动执行程序

在我们开始编写拍卖智能合约之前，我们将讨论智能合约自动化。

智能合约无法自动执行。在链上交易触发之前，他们的代码不会在区块链上运行和更改状态。外部交易作为“戳”来唤醒智能合约并启动其逻辑。例如，我们可以通过向拍卖合约发送消息来开始拍卖。

当拍卖时间过去后，需要处理拍卖结果。但是，在有人向合约发送适当的消息之前，不会处理结果。

在 Gear 中，我们通过延迟消息解决了这个问题。
```
msg::send_delayed(program, payload, value, delay)
msg::send_bytes_delayed(program, payload, value, delay)
```

延迟消息在指定的延迟后执行。在我们的场景中这很方便：我们可以通过向拍卖合约发送消息来开始拍卖。完成所有必要的逻辑后，拍卖合约将向自己发送一条延迟消息，它将在指定时间后结算拍卖。

因此，发送延迟消息的能力允许你自动执行合约。只要有足够的 gas 来执行，合约就可以自动执行无限数量的区块。但如果 gas 用完，执行可能会中断。

Gear Protocol 允许另一个强大的功能 —— gas 预留。开发人员可以保留可用于发送常规或延迟消息的 gas。

要保留 gas 量以供进一步使用，请使用以下功能：
```
let reservation_id = ReservationId::reserve(RESERVATION_AMOUNT, TIME)
                                   .expect("reservation across executions");
```

该函数从该程序的可用量中获取一定量的 gas 并将其保留。保留获得一个程序使用的唯一标识符，以获取此保留 gas 并在以后使用它。

你还必须指明必须使用储备的区块数。Gas 预留不是免费的：一个区块的预留需要 100 gas。reserve 函数返回 ReservationId，用于发送带有该 gas 的消息。要使用保留的 gas 发送消息：
```
msg::send_from_reservation(reservation_id, program, payload, value)
                               .expect("Failed to send message from reservation");
```

如果在预留期限内不需要 gas，可以取消预留，gas 将退还给预留用户。
```
id.unreserve().expect("unreservation across executions");
```

### 理解合约状态和逻辑

让我们开始编写拍卖合约。首先我们定义合约状态的结构：

- Tamagotchi_id - 当前拍卖的 Tamagotchi 合约的地址；

- status - 拍卖状态（可以是 ReadyToStart 或 InProcess）；

- current_bid - 当前最高出价；

- current_bidder - 当前出价最高的参与者的地址；

- ended_at - 拍卖结束时间；

- prev_tmg_owner - Tamagotchi 的前任所有者（拍卖合约必须存储此帐户，以防万一没有人参加拍卖并且 Tamagotchi 必须归还给前任所有者）。
```
static mut AUCTION: Option<Auction> = None;

#[derive(Default)]
pub struct Auction {
   Tamagotchi_id: TamagotchiId,
   status: Status,
   current_bid: u128,
   current_bidder: ActorId,
   ft_contract_id: ActorId,
   transaction_id: TransactionId,
   ended_at: u64,
   prev_tmg_owner: ActorId,
}
#[derive(Debug, PartialEq, Eq)]
pub enum Status {
   ReadyToStart,
   InProcess,
}

impl Default for Status {
   fn default() -> Self {
       Self::ReadyToStart
   }
}

```

让我们定义合约将接收的消息：

- StartAuction {Tamagotchi_id, minimum_bid, duration} - 启动拍卖开始的消息。Tamagotchi 所有者必须注明 Tamagotchi 合约的地址、起拍价和拍卖持续时间；

- MakeBid { bid } - 来自拍卖参与者的消息，他们必须表明他们准备为 Tamagotchi 支付的价格（出价）；

- SettleAuction - 合约在拍卖结束后收到的消息。如果有出价，那么拍卖合约会将 Tamagotchi 分配给拍卖获胜者。否则，拍卖合约会将 Tamagotchi 转让给之前的所有者。
```
pub type TamagotchiId = ActorId;
pub type Bid = u128;

#[derive(Encode, Decode)]
pub enum AuctionAction {
   StartAuction {
       Tamagotchi_id: TamagotchiId,
       minimum_bid: Bid,
       duration: u64,
   },
   MakeBid {
       bid: Bid,
   },
   SettleAuction,
}
```

你可以猜到，拍卖合约将与同质化代币合约以及 Tamagotchi 合约进行交互。也就是说，它会向这些合约发送消息并等待回复。因此，交易不会是原子性的，我们必须考虑这一点以保持 3 个合约的状态一致。

让我们详细看看合约的每个动作。StartAuction 必须将 Tamagotchi 的所有者更改为拍卖合约并设置拍卖参数。

我们考虑所有可能导致状态不一致的情况。拍卖合约向 Tamagotchi 合约发送消息，可能出现以下情况：

1. Tamagotchi 合约在消息执行期间因缺乏 gas 或逻辑错误而失败。它没有保存状态，因此拍卖和 Tamagotchi 处于一致状态，但是，拍卖合约不知道 Tamagotchi 合约中发生了什么。

2. Tamagotchi 执行消息并保存状态，但在进一步操作期间 gas 耗尽。然后，Tamagotchi 合约的状态发生了变化，但这并没有反映在拍卖合约中。
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/74db231b-e82b-4338-a0ce-d391589429db)

MakeBid 动作的工作流程如下：

1. 用户出价，表明他愿意为 Tamagotchi 支付的代币数量。

2. 合约将他的代币转移到它的余额中，如果转移成功，它会将代币返回给之前的投标人。在代币合约执行期间、对拍卖合约的回复期间或进一步执行期间，gas 可能会用完。
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/c96f3c19-1c02-478a-8b7b-618f72b24cf5)

收到 SettleAuction 消息后，合约执行以下操作：

1. 将 Tamagotchi 所有者更改为拍卖获胜者。在 Tamagotchi 合约执行期间、回复期间或进一步拍卖合约执行期间，gas 可能会用完。

2. 将代币转让给之前的所有者。同样，在可替代合约执行期间、回复期间或进一步拍卖合约执行期间，gas 可能会用完。
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/84313d48-dada-4226-8ca9-b6654bc0ca06)

因此，让我们创建以下枚举来跟踪交易：
```
#[derive(Clone)]
enum Transaction {
   StartAuction {
       tamagotchi_id: ActorId,
       bid: Bid,
       duration: u64,
   },
   MakeBid {
       transaction_id: TransactionId,
       bidder: ActorId,
       bid: u128,
   },
   SettleAuction {
       transaction_id: TransactionId,
   },
}
```

并将字段添加到合同状态：
```
#[derive(Default)]
pub struct Auction {
   . . .
  transaction: Some<Transaction>,
  transaction_id: TransactionId
   . . .
}
```

其中字段 transaction_id 将用于跟踪同质化代币合约中的交易。

### 练习合约编码

在本教程中，我们不使用 panic!，而是返回 Result<AuctionEvent,AuctionError>。当合约的执行是原子的并且其中没有异步调用时，panic 使用起来很方便。

在我们的范例中，会有很多异步消息调用的场景，我们必须仔细跟踪程序的状态。在这种情况下，使用 Result 枚举是首选。

我们将创建我们将在编写程序期间扩展的枚举 AuctionEvent 和 AuctionError。
```
#[derive(Encode, Decode)]
pub enum AuctionEvent {
   ...
}

#[derive(Encode, Decode)]
pub enum AuctionError {
   ...
}
```

因此，主要功能：
```
#[gstd::async_main]
async fn main() {
   let action: AuctionAction = msg::load().expect("Unable to decode `AuctionAction`");
   let auction = unsafe { AUCTION.get_or_insert(Default::default()) };
   let reply = match action {
       AuctionAction::StartAuction {
           Tamagotchi_id,
           minimum_bid,
           duration,
       } => {
           auction
               .start_auction(&Tamagotchi_id, minimum_bid, duration)
               .await
       }
       AuctionAction::MakeBid { bid } => {
           auction.make_bid(bid).await
       }
       AuctionAction::SettleAuction => {
           auction.settle_auction().await
       }
   };
   msg::reply(reply, 0).expect("Failed to encode or reply with `Result<MarketEvent, MarketErr>`");
}
```

让我们开始编写函数 start_auction：
```
async fn start_auction(
       &mut self,
       Tamagotchi_id: &TamagotchiId,
       minimum_bid: Bid,
       duration: u64,
   ) -> Result<AuctionEvent, AuctionError> {}
```

我们检查拍卖是否处于 ReadyToStart 状态：
```
if self.status != Status::ReadyToStart {
           return Err(AuctionError::WrongState);
       }
```

然后我们检查是否有未决交易。如果有，我们：

- 检查它是交易 StartAuction；

- 检查函数的输入参数。如果它们与存储在交易中的不同，合约会回复错误；

- 找到 Tamagotchi 主人。如果已经是拍卖合约，则不再向 Tamagotchi 合约发送消息，直接保存在拍卖合约中。然后我们停止消息执行。
```
       // Check if there is already a pending transaction
       if let Some(tx) = self.transaction.clone() {
           match tx {
               Transaction::StartAuction { 
                       tamagotchi: prev_tmg_id,
                       bid, 
                       duration: prev_duration, 
                   } => {
                       if *tamagotchi_id != prevamagotchi_id
                       || bid != minimum_bid
                       || prev_duration != duration
                   {
                       return Err(AuctionError::WrongParams);
                   }

                   // get the Tamagotchi owner
                   let tmg_owner = 
                      if let Ok(tmg_owner) = get_owner(&self.Tamagotchi_id).await {
                       tmg_owner
                   } else {
                       self.transaction = None;
                       return Err(AuctionError::WrongReceivedMessage);
                   };

                   // if Tamagotchi owner is already the current contract
                   // we just change its state and start the auction
                   if tmg_owner == exec::program_id() {                    
                       self.tamagotchi_id = *tamagotchi_id;
                       self.status = Status::InProcess;
                       self.current_bid = bid;
                       self.ended_at = exec::block_timestamp() + duration;
                       self.transaction = None;
                       return Ok(AuctionEvent::AuctionStarted)
                   };
  
                   // check that owner starts the auction
                   if tmg_owner != msg::source() {
                       return Err(AuctionError::NotOwner);
                   }
  
                   if change_owner(&self.Tamagotchi_id, &exec::program_id())
                       .await
                       .is_err()
                   {
                       self.transaction = None;
                       return Err(AuctionError::UnableToChangeOwner);
                   } else {
                       self.tamagotchi_id = *tamagotchi_id;
                       self.status = Status::InProcess;
                       self.current_bid = bid;
                       self.prev_tmg_owner = tmg_owner;
                       self.ended_at = exec::block_timestamp() + duration;
                       self.transaction = None;
                       msg::send_delayed(
                           exec::program_id(),
                           AuctionAction::SettleAuction,
                           0,
                           duration as u32,
                       )
                       .expect("Error in sending a delayed message `AuctionAction::SettleAuction`");
                       return Ok(AuctionEvent::AuctionStarted);
                   }
               }
               _ => {
                   return Err(AuctionError::WrongTx);
               }
           }
       }
```

获取所有者的功能位置：
```
async fn get_owner(Tamagotchi_id: &TamagotchiId) -> Result<ActorId, AuctionError> {
   let reply = msg::send_for_reply_as(*Tamagotchi_id, TmgAction::Owner, 0)
       .expect("Error in sending a message `TmgAction::Owner` to Tamagotchi contract")
       .await;
   match reply {
       Ok(TmgEvent::Owner(tmg_owner)) => {
           Ok(tmg_owner)
       },
       _ => Err(AuctionError::WrongReceivedMessage)
   }
}
```

以及更改所有者的功能：
```
async fn change_owner(
   Tamagotchi_id: &TamagotchiId,
   new_owner: &ActorId,
) -> Result<TmgEvent, ContractError> {
   msg::send_for_reply_as::<_, TmgEvent>(
       *Tamagotchi_id,
       TmgAction::ChangeOwner {
           new_owner: *new_owner,
       },
       0,
   )
   .expect("Error in sending a message `TmgAction::ChangeOwner` to Tamagotchi contract")
   .await
}
```

如果没有未决交易，下面的逻辑很简单：
```
      if duration < MIN_DURATION {
           return Err(AuctionError::WrongDuration);
       }


       self.transaction = Some(Transaction::StartAuction {
           tamagotchi_id: *tamagotchi_id,
           bid: minimum_bid,
           duration,
       });

       let tmg_owner = if let Ok(tmg_owner) = get_owner(&self.Tamagotchi_id).await {
           tmg_owner
       } else {
           self.transaction = None;
           return Err(AuctionError::WrongReceivedMessage);
       };
      
       // check that owner starts the auction
       if tmg_owner != msg::source() {
           self.transaction = None;
           return Err(AuctionError::NotOwner);
       }

       if change_owner(&self.Tamagotchi_id, &exec::program_id())
           .await
           .is_err()
       {
           self.transaction = None;
           Err(AuctionError::UnableToChangeOwner)
       } else {
           self.tamagotchi_id = *tamagotchi_id;
           self.status = Status::InProcess;
           self.current_bid = minimum_bid;
           self.prev_tmg_owner = tmg_owner;
           self.ended_at = exec::block_timestamp() + duration;
           self.transaction = None;
           msg::send_delayed(
               exec::program_id(),
               AuctionAction::SettleAuction,
               0,
               duration as u32,
           )
           .expect("Error in sending a delayed message `AuctionAction::SettleAuction`");
           Ok(AuctionEvent::AuctionStarted) 
}
```

如你所见，当我们继续上一个交易或执行当前交易时，代码会重复。

让我们编写函数 complete_tx：
```
async fn complete_tx(&mut self, tx: Transaction) -> Result<AuctionEvent, AuctionError> {
       match tx {
           Transaction::StartAuction { bid, duration } => {
               let tmg_owner = if let Ok(tmg_owner) = get_owner(&self.Tamagotchi_id).await {
                   tmg_owner
               } else {
                   self.transaction = None;
                   return Err(AuctionError::WrongReceivedMessage);
               };
               // if Tamagotchi owner is already the current contract
               // we just change its state and start the auction
               if tmg_owner == exec::program_id() 
                   self.status = Status::InProcess;
                   self.current_bid = bid;
                   self.ended_at = exec::block_timestamp() + duration;
                   self.transaction = None;
                   return Ok(AuctionEvent::AuctionStarted);
               };

               // check that owner starts the auction
               if tmg_owner != msg::source() {
                   return Err(AuctionError::NotOwner);
               }

               if change_owner(&self.Tamagotchi_id, &exec::program_id())
                   .await
                   .is_err()
               {
                   self.transaction = None;
                   Err(AuctionError::UnableToChangeOwner)
               } else {
                   self.status = Status::InProcess;
                   self.current_bid = bid;
                   self.prev_tmg_owner = tmg_owner;
                   self.ended_at = exec::block_timestamp() + duration;
                   self.transaction = None;
                   msg::send_delayed(
                       exec::program_id(),
                       AuctionAction::SettleAuction,
                       0,
                       duration as u32,
                   )
                   .expect("Error in sending a delayed message `AuctionAction::SettleAuction`");
                   Ok(AuctionEvent::AuctionStarted)
               }
           }
           Transaction::MakeBid {
               transaction_id,
               bidder,
               bid,
           } => Ok(AuctionEvent::BidMade { bid }),
           Transaction::SettleAuction { transaction_id } => Ok(AuctionEvent::AuctionSettled),
       }
   }
```
那么函数 start_auction 将改写如下
```
async fn start_auction(
       &mut self,
       Tamagotchi_id: &TamagotchiId,
       minimum_bid: Bid,
       duration: u64,
   ) -> Result<AuctionEvent, AuctionError> {
       if self.status != Status::ReadyToStart {
           return Err(AuctionError::WrongState);
       }

       // Check if there is already a pending transaction
       if let Some(tx) = self.transaction.clone() {
           match tx {
              Transaction::StartAuction { 
                       tamagotchi: prev_tmg_id,
                       bid, 
                       duration: prev_duration, 
                   } => {
                       if *tamagotchi_id != prevamagotchi_id
                       || bid != minimum_bid
                       || prev_duration != duration
                   {
                       return Err(AuctionError::WrongParams);
                   }
                       return self
                          .complete_tx(Transaction::StartAuction { bid, duration })
                       .  await;
               }
               _ => {
                   return Err(AuctionError::WrongTx);
               }
           }
       }

       if duration < MIN_DURATION {
           return Err(AuctionError::WrongDuration);
       }
       
       let tx = Transaction::StartAuction {
              tamagotchi_id: *tamagotchi_id,
              bid: minimum_bid,
              duration,
       };
       self.transaction = Some(tx.clone());

       self.complete_tx(tx).await
   }
```

太好了，我们完成了这个函数，现在我们将开始编写出价函数：

1. 首先，我们检查是否没有待处理的交易 MakeBid；

2. 接下来，我们检查输入参数。如果它们与保存在交易中的不同，我们完成前一个交易并执行当前交易。如果它们相同，我们完成未决交易并停止函数执行。

3. 如果没有未决交易，我们执行当前交易。
```
async fn make_bid(&mut self, bid: u128) -> Result<AuctionEvent, AuctionError> {
       if self.status != Status::InProcess {
           return Err(AuctionError::WrongState);
       }

       // Check if there is already a pending transaction
       if let Some(tx) = self.transaction.clone() {
           match tx {
               Transaction::MakeBid {
                   transaction_id,
                   bidder,
                   bid: prev_bid,
               } => {
                   let result = self
                       .complete_tx(tx).await;
                   if bidder == msg::source() && bid == prev_bid {
                       return result;
                   }
               }
               _ => {
                   return Err(AuctionError::WrongTx);
               }
           }
       }

       if bid <= self.current_bid {
           return Err(AuctionError::WrongBid);
       }

       let transaction_id = self.transaction_id;
       let bidder = msg::source(); 
       // We reserve 2 transaction ids since there will be 2 messages to the token contract
       self.transaction_id = self.transaction_id.wrapping_add(2);
       let tx = Transaction::MakeBid {
           transaction_id,
           bidder,
           bid,
       };
       self.transaction = Some(tx.clone());
       self.complete_tx(tx).await
   }
```

让我们扩展函数 complete_tx：
```
async fn complete_tx(&mut self, tx: Transaction) -> Result<AuctionEvent, AuctionError> {
       match tx {
           ...
           Transaction::MakeBid {
               transaction_id,
               bidder,
               bid,
           } => {
               if transfer_tokens(
                   transaction_id,
                   &self.ft_contract_id,
                   &bidder,
                   &exec::program_id(),
                   bid,
               )
               .await
               .is_err()
               {
                   self.transaction = None;
                   return Err(AuctionError::UnableToTransferTokens);
               }

               // if it's not the first bet
               // we have to return the tokens to the previous bidder
               // since the tokens are on the auction contract
               // the transaction can fail only due to lack of gas
               // it's necessary to rerun the transaction
               if !self.current_bidder.is_zero()
                   && transfer_tokens(
                       transaction_id + 1,
                       &self.ft_contract_id,
                       &exec::program_id(),
                       &self.current_bidder,
                       self.current_bid,
                   )
                   .await
                   .is_err()
               {
                   return Err(AuctionError::RerunTransaction);
               }

               self.current_bid = bid;
               self.current_bidder = bidder;
               Ok(AuctionEvent::BidMade { bid })
           }
        ...
       }
   }
```

因此，下一步是编写函数 settle_auction。在这里，我们再次检查是否存在未决交易。

但是有可能在用户出价的时候状态留下了一笔交易 MakeBid。

在这种情况下，我们必须先完成这笔交易，然后再执行交易 SettleAuction：
```
async fn settle_auction(&mut self) -> Result<AuctionEvent, AuctionError> {
       if self.ended_at < exec::block_timestamp() {
           return Err(AuctionError::WrongState);
       }

       // it's possible that there is a pending transaction `MakeBid`
       if let Some(tx) = self.transaction.clone() {
           match tx {
               Transaction::MakeBid { .. } => {
                   self.complete_tx(tx).await;
               }
               Transaction::SettleAuction { .. } => {
                   return self.complete_tx(tx).await;
               }
               _ => {
                   return Err(AuctionError::WrongTx);
               }
           }
       }

       let transaction_id = self.transaction_id;
       self.transaction_id = self.transaction_id.wrapping_add(1);
       let tx = Transaction::SettleAuction { transaction_id };
       self.transaction = Some(tx.clone());
       return self.complete_tx(tx).await;
   }
```

相应地，complete_tx 函数：
```
async fn complete_tx(&mut self, tx: Transaction) -> Result<AuctionEvent, AuctionError> {
       match tx {
	     ...
           Transaction::SettleAuction { transaction_id } => {
               let tmg_owner = if let Ok(tmg_owner) = get_owner(&self.Tamagotchi_id).await
               {
                   tmg_owner
               } else {
                   return Err(AuctionError::WrongReceivedMessage);
               };
               if tmg_owner == exec::program_id() {
                   if self.current_bidder.is_zero() {
                       if change_owner(&self.Tamagotchi_id, &self.prev_tmg_owner)
                           .await
                           .is_err()
                       {
                           return Err(AuctionError::RerunTransaction);
                       };
                   } else {
                       if transfer_tokens(
                           transaction_id,
                           &self.ft_contract_id,
                           &exec::program_id(),
                           &self.prev_tmg_owner,
                           self.current_bid,
                       )
                       .await
                       .is_err()
                       {
                           return Err(AuctionError::RerunTransaction);
                       };

                       if change_owner(&self.Tamagotchi_id, &self.current_bidder)
                           .await
                           .is_err()
                       {
                           return Err(AuctionError::RerunTransaction);
                       };
                   }
               }
               self.transaction = None;
               self.prev_tmg_owner = ActorId::zero();
               self.current_bidder = ActorId::zero();
               self.status = Status::ReadyToStart;
               self.ended_at = 0;
               self.tamagotchi_id = ActorId::zero();

               Ok(AuctionEvent::AuctionSettled)
           }
```

### 系统信号

在 Gear 程序中，共有三个公共入口点：init、handle 和 handle_reply。Gear Protocol 还引入了 handle_signal 入口点，它使系统能够与程序通信并通知它们（信号）与程序消息相关的事件。只有系统（Gear 节点运行时）可以向程序发送信号消息。

如果在程序执行期间发生某些错误，系统会向程序发送消息。例如，一个程序可能会崩溃或耗尽 gas。

gstd 库提供了一个单独的函数来专门为系统信号消息保留 gas。
```
exec::system_reserve_gas(1_000_000_000).expect("Error during system gas reservation");
```

这不能用于发送其他常规的 cross-actor 消息。虽然信号可用于 actor 间通信，但它们不适合发送常规的cross-actor 消息。

信号消息使用专门为它们保留的 gas 。如果没有为系统消息保留 gas，它们将被跳过，程序将不会接收它们。

如果 gas 已被保留，但在当前执行期间没有系统消息出现，则该 gas 将返回至它被获取的地方。

如果你的程序使用异步消息，使用 #[gstd::async_main] 宏扩展 handle_signal 入口点，会释放程序占用的资源。

在 Gear 中，使用自定义异步逻辑涉及将 Future 存储在程序的内存中。这些 Futures 的执行上下文会占用大量内存，尤其是在处理许多 Futures 时。

需要注意的是，如果一个程序发送消息并等待回复，但无法收到回复，则可能是因为缺少 gas。例如 waitlist 中的初始消息用完 gas 或者 gas 量不足，就收不到回复。

要在程序中处理信号，你可以定义自己的 my_handle_signal 入口点并为其编写自定义逻辑。在下一节中，我们将看到如何在拍卖合约中编写此函数的示例。

### 添加 gas 预留和系统信号

让我们将入口点 my_handle_signal 添加到我们的拍卖合约中。该功能将确认是否有未决交易。如果存在，该函数将获取预留的 gas 并使用该 gas 发送消息 CompleteTx。

首先，我们必须通过扩展枚举 AuctionAction 和 AuctionEvent 添加 gas 预留操作：
```
#[derive(Encode, Decode)]
pub enum AuctionAction {
   ... 
   MakeReservation,
}

#[derive(Encode, Decode)]
pub enum AuctionEvent {
   ...
   ReservationMade,
}
```

我们还需要在 Auction 结构中添加一个字段 reservations 来保存 gas reservations 的 ids：
```
#[derive(Default)]
pub struct Auction {
   ... 
   reservations: Vec<ReservationId>,
}
```

接下来，我们将为 Auction 结构定义 make_reservation 方法：
```
impl Auction {
   ...
   fn make_reservation(&mut self) -> Result<AuctionEvent, AuctionError> {
       let reservation_id = ReservationId::reserve(RESERVATION_AMOUNT, RESERVATION_DURATION)
           .expect("reservation across executions");
       self.reservations.push(reservation_id);
       Ok(AuctionEvent::ReservationMade)
   }
}
```

这里，RESERVATION_AMOUNT 和 RESERVATION_DURATION 是常量，定义如下：
```
const RESERVATION_AMOUNT: u64 = 50_000_000_000;
const RESERVATION_DURATION: u32 = 86400;
```
然后我们必须添加完成交易的动作。

我们将使用以下方法将操作添加到枚举 AuctionAction：
```
#[derive(Encode, Decode)]
pub enum AuctionAction {
   ...
   CompleteTx(Transaction),
}
```
该交易是我们之前定义过的一个枚举
```
#[derive(Clone, Encode, Decode, PartialEq, Eq)]
pub enum Transaction {
   StartAuction {
       tamagotchi: ActorId,
       bid: Bid,
       duration: u64,
   },
   MakeBid {
       transaction_id: TransactionId,
       bidder: ActorId,
       bid: u128,
   },
   SettleAuction {
       transaction_id: TransactionId,
   },
}
```

我们还将扩展入口点 main()：
```
#[gstd::async_main]
async fn main() {
       ...
       AuctionAction::MakeReservation => auction.make_reservation(),
       AuctionAction::CompleteTx(tx) => {
           let result = if let Some(_tx) = &auction.transaction {
               if tx == _tx.clone() {
                  auction.complete_tx(tx).await
               } else {
                   Err(AuctionError::WrongTx)
               }
           } else {
               Err(AuctionError::NoTx)
           };
           result     
       },
   };
}
```

让我们编写函数 my_handle_signal。此功能负责检查是否有未决交易以及是否有可用的 gas 预留。如果是这样，它将使用该 gas 发送一条消息 CompleteTx。
```
#[no_mangle]
extern "C" fn my_handle_signal() {
   let auction = unsafe { AUCTION.get_or_insert(Default::default()) };
   if let Some(tx) = &auction.transaction {
       let reservation_id = if !auction.reservations.is_empty() {
           auction.reservations.remove(0)
       } else {
           return;
       };
       msg::send_from_reservation(
           reservation_id,
           exec::program_id(),
           AuctionAction::CompleteTx(tx.clone()),
           0,
       )
       .expect("Failed to send message");
   }
}
```

在每次交易之前，还需要为系统消息预留 gas。下面是我们将如何实现它：
```
#[gstd::async_main]
async fn main() {
   ... 
   let reply = match action {
       AuctionAction::StartAuction {
           Tamagotchi_id,
           minimum_bid,
           duration,
       } => {
           system_reserve_gas();
           auction
               .start_auction(&Tamagotchi_id, minimum_bid, duration)
               .await
       }
       AuctionAction::MakeBid { bid } => {
           system_reserve_gas();
           auction.make_bid(bid).await
       }
       AuctionAction::SettleAuction => {
           system_reserve_gas();
           auction.settle_auction().await
       }
       ...
   msg::reply(reply, 0).expect("Failed to encode or reply with `Result<MarketEvent, MarketErr>`");
}

fn system_reserve_gas() {
   exec::system_reserve_gas(SYSTEM_GAS).expect("Error during system gas reservation");
}
```

### 任务：

在此作业中，你将向你的 Tamagotchi 合约添加一个新功能，这将允许它以指定的时间间隔向自己发送延迟消息以检查其状态。如果 Tamagotchi 饥饿、疲惫或不开心，它应该向用户发送一条消息，要求喂食或玩耍。

要实现此功能，您需要使用 reservations 字段扩展 Tamagotchi 状态，如下所示：
```
#[derive(Default, Encode, Decode, TypeInfo)]
pub struct Tamagotchi {
   pub name: String,
   pub date_of_birth: u64,
   pub owner: ActorId,
   pub fed: u64,
   pub fed_block: u64,
   pub entertained: u64,
   pub entertained_block: u64,
   pub rested: u64,
   pub rested_block: u64,
   pub allowed_account: Option<ActorId>,
   pub ft_contract_id: ActorId,
   pub ft_transaction_id: TransactionId,
   pub approve_transaction: Option<(TransactionId, ActorId, u128)>,
   pub reservations: Vec<ReservationId>,
}
```

接下来，你需要向 TmgAction 枚举添加两个新的传入消息：CheckState 和 ReserveGas，如下所示：
```
#[derive(Encode, Decode, TypeInfo)]
pub enum TmgAction {
   Name,
   Age,
   Feed,
   Play,
   Sleep,
   Transfer(ActorId),
   Approve(ActorId),
   RevokeApproval,
   ApproveTokens {
       account: ActorId,
       amount: u128,
   },
   SetFTokenContract(ActorId),
   BuyAttribute {
       store_id: ActorId,
       attribute_id: AttributeId,
   },
   CheckState,
   ReserveGas {
       reservation_amount: u64,
       duration: u32,
   },
}
```

你还需要向 TmgEvent 枚举添加三个新的输出消息：FeedMe、PlayWithMe 和 WantToSleep。如果 Tamagotchi 用完了 gas，它应该发送消息 MakeReservation 要求所有者保留 gas 以继续检查状态。

你还应该添加输出消息 GasReserved 以指示成功预留 gas ，如下所示：
```
#[derive(Encode, Decode, TypeInfo)]
pub enum TmgEvent {
   Name(String),
   Age(u64),
   Fed,
   Entertained,
   Slept,
   Transfer(ActorId),
   Approve(ActorId),
   RevokeApproval,
   ApproveTokens { account: ActorId, amount: u128 },
   FTokenContractSet,
   ApprovalError,
   AttributeBought(AttributeId),
   CompletePrevPurchase(AttributeId),
   ErrorDuringPurchase,
   FeedMe,
   PlayWithMe,
   WantToSleep,
   MakeReservation,
   GasReserved,
}
```

因此，Tamagotchi 必须在一定的时间间隔内向自己发送一次消息。定义此时间间隔并确定 Tamagotchi 将在吃饱、睡觉或娱乐的水平开始发送消息。

将你的 Tamagotchi 连接到应用程序，看看它如何与你交流！

