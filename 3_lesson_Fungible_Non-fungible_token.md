## 第 3 课：了解同质化/非同质化代币

### 课程总结

- 本课介绍加密代币的概念

- 我们解释了同质化和非同质化代币 (NFT) 及其主要功能

- 我们还解释了同质化和非同质化代币 (NFT) 之间的区别

- 强调了理解这些密码学概念的重要性，尤其是在创建程序方面

### 课程目标

在课程结束时，你将收获：

- 定义加密代币并将它们与其他类型的代币区分开来

- 区分同质化和非同质化代币并解释它们各自的用例

- 应用加密代币知识，使用同质化和非同质化代币创建程序

- 了解如何在 Gear Protocol 中实现同质化和非同质化代币

### 让我们开始吧！

### 同质化代币及其属性

同质化代币提供与法定货币相同的价值和可兑换性。就像将一张纸币换成另一张纸币一样，这些数字智能合约允许用户在账户之间交易等值的代币化资产。然而，在基础技术层面上，同质化代币只是存储账户地址和代币数量之间映射的智能合约。

аddress -> amount

此类智能合约的主要功能是：

- Transfer(from, to, amount)：此功能允许你将代币数量（金额）从一个地址（from）转移到另一个地址（to）。它检查“from”账户是否拥有代币，从其余额中减去必要的金额，并将指定的代币数量添加到“to”账户。

- `Approve(spender, amount)` 是一个函数，它允许你授权指定的 spender 账户处置调用此函数的账户的代币（在目前的场景中，它将是 msg::source()）。换句话说，spender 账户可以调用 transfer() 函数，所以它可以将 token 从 msg::source() 账户转移到指定地址。此功能在任何合约中发生代币转移时非常有用。

我们以 escrow 智能合约为例。

在这个例子中，货物是使用代币支付的，而不是 msg::value()。买方发送 deposit() 消息，escorw 智能合约访问代币合约并发送代币转移消息。在此特定消息中，发件人地址是买家地址。

如果 escrow 合约无权处置买方的代币，那么代币合约就会 panic 并阻止代币转移。

- `Mint(to,amount)`：这个函数增加了合约中的代币数量。通常，此函数可以由允许创建新代币的某些帐户调用。
- `Burn(from, amount)`：是一个减少合约中代币数量的函数。就像 mint() 函数一样，并非所有帐户都可以销毁代币。

### 非同质化代币

非同质化代币或者说 NFT 提供了一种独特的方式来证明数字资产的所有权。虽然传统的同质化代币可以互换并存储价值，NFT 带有加密凭证，证明所有者对数字艺术或游戏资产等资产的所有权。

аddress -> token_id

此类代币合约的主要功能类似于同质化代币：

- Transfer(to, token_id) 是一个函数，允许你将带有 token_id 编号的代币转移到 to 帐户。与同质化代币合约不同，该合约不需要来自该账户，因为每个代币都有自己的所有者。

- Approve(approved_account, token_id) 是一个函数，允许你将处理代币的权利授予指定的 approved_account。此功能可用于市场拍卖。当所有者想要出售他的代币时，他们可以将其放在 marketplace/auction 中，因此合约会将此代币发送给新的所有者。

- `Mint(to, token_id, metadata)`：是一个创建新 token 的函数。元数据可以包括关于 token 的任何信息：它可以是特定资源的链接、代币的描述等。

- `Burn(from, token_id)`：此函数从合约中删除具有上述 token_id 的代币。

### 程序间的异步通信

Gear Protocol 的核心特性是用于消息传递通信的 Actor 模型。Gear Protocol 利用 Actor 模型进行消息传递通信，允许并行计算和异步消息传递以确保更快的处理时间。此开发结构为开发人员在构建复杂的 dApp 时提供了巨大的灵活性。

如果一个程序向另一个程序发送异步消息，它需要等待那个程序的回复才能进行下一个操作。

要向 Gear 程序发送消息，我们使用 `send_for_reply(program, payload, value)` 函数。在这个函数中：

- program - 要为其发送消息的程序的地址；

- payload - 给程序的消息；

- value - 附加到消息的资金。
```rust
 pub fn send_for_reply_as<E: Encode, D: Decode>(
   program: ActorId,
   payload: E,
   value: u128
) -> Result<CodecMessageFuture<D>>
```

### 分布式交易

Gear Protocol 中程序之间的交互创建分布式交易，涉及具有各自状态的参与者之间的操作。在我们的例子中，操作是在具有状态的参与者之间执行的。分布式交易必须具备以下特性：

- 原子性：所有数据更改都被视为单个操作。也就是说，要么进行所有修改，要么不进行任何修改。

- 一致性：这个属性意味着当一个交易开始和结束时，数据的状态是一致的。

例如，在以太坊交易中，全局状态更改仅在所有执行成功完成时发生。如果在执行期间发生错误，对状态的所有更改都将“回滚”，就好像交易从未运行过一样。

让我们看看下面的代码：
```rust
static mut COUNTER: u32 = 0;

async unsafe fn non_atomic() {
   COUNTER = 10;

   send_for_reply(msg::source(), "PING", 0)
       .expect("Error during sending message")
       .await
       .expect("Error during message execution");

   COUNTER = 20;
}
```

在提供的示例代码中，全局变量 COUNTER 在调用 send_for_reply 函数之前设置为 10。如果交易在 .await 之前失败，则状态回滚，COUNTER 归 0。如果交易在 .await 之后失败，COUNTER 的值保持为 10。

让我们考虑一个简单的 marketplace 示例，其中代币被转移给卖家，然后将 NFT 转移给买家。
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/5b07e4d0-8f58-4166-85ec-76dde4c91275)

图片显示了以下情况：

1. Marketplace 成功将代币转移给卖家；

2. NFT 转给买方过程中，交易失败。

代币转移成功后，NFT 从卖方转移到买方的过程中的交易失败将导致不一致的状态，即卖方收到付款但买方没有收到 NFT。因此，在开发应用程序和不同标准时，我们必须考虑导致状态不一致的潜在故障。

### 在 Gear 上实现同质化代币

我们建议将同质化代币拆分为三个合约：

1. 作为代理程序的主同质代币，将消息重定向到逻辑合约。

2. 代币逻辑合约 —— 负责实现主要的标准代币功能。我们将逻辑放在一个单独的合约中，以在不丢失同质化代币地址和合约状态的情况下添加更多功能。

3. 存储合约：这些合约存储用户的余额。
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/721a5ea7-3d92-4e35-bfb8-be5462173f1c)

代币标准有一个防止重复交易（保持幂等性）的特性：发送交易时有两种可能的风险：

- 发送重复交易

- 由于网络故障而不知道交易状态。

发送方可以放心，交易只会执行一次（幂等性）。

### 存储合约架构

存储合同状态有以下字段：

- 逻辑合约的地址。存储合约必须执行仅从该地址接收的消息；
```rust
ft_logic_id: ActorId
```

- 已执行的交易。在每条消息中，存储合约接收正在执行的交易的哈希值，并将其执行结果存储在字段 Executed 中。如果 Executed 为 true，则消息执行成功，否则 Executed 等于 false。
```rust
transaction_status: HashMap<H256, (Executed, Locked)>
```

- 账户余额
```rust
balances: HashMap<ActorId, u128>
```

- 核准帐目
```rust
approvals: HashMap<ActorId, HashMap<ActorId, u128>>
```

存储接受的消息：

- 增加余额：存储增加指定账户的余额；

- 减少余额：存储减少指定账户的余额；

- 批准：存储允许账户授予另一个账户转移其代币的权限；

- 转账：将代币从一个账户转移到另一个账户。当代币转移发生在一个存储中时，将从逻辑合约调用消息。

- 清除：删除已执行交易的哈希。

该存储合约不进行任何异步调用，因此它的执行是原子性的。

### 逻辑合约架构

逻辑合约的状态由以下字段组成：

-   主代币合约地址。逻辑合约必须只执行来自该地址的消息：
```rust
ftoken_id: ActorId
```

- 交易。与存储合约一样，逻辑合约接收正在执行的交易的哈希值并存储其执行结果。但与消息执行是原子的存储合约不同，逻辑合约必须跟踪正在执行的消息及其阶段。
```rust
transactions: HashMap<H256, Transaction>
```

交易结构如下：
```rust
pub struct Transaction {
   msg_source: ActorId,
   operation: Operation,
   status: TransactionStatus,
}
```

其中 msg_source 是一个向主合约发送消息的账户。Operation 是逻辑合约应该处理的动作，status 是交易状态。它是以下枚举。
```rust
pub enum TransactionStatus {
   InProgress,
   Success,
   Failure,
}
```

- InProgress - 交易执行开始；

- 成功或失败 - 交易已完成（成功或失败）。在这种情况下，逻辑合约只发送一个响应，表明这个哈希值的交易已经完成。

- **存储合约的代码哈希**。逻辑合约能够在必要时创建新的存储合约。存储创建实现如下：

    - 逻辑合约取账户地址的首字母。如果创建了这个存储合约，那么它将这个账户的余额存储在这个合约中。如果不是，它会创建一个新的存储合约
```rust
storage_code_hash: H256
```

-   从字母到存储地址的映射。
```rust
   id_to_storage: HashMap<String, ActorId>
```

逻辑合约从主合约接收到以下消息：
```rust
Message {
   transaction_hash: H256,
   account: ActorId,
   payload: Vec<u8>,
},
```

该帐户是向主合约发送消息的参与者。

有效负载是逻辑合约必须处理的编码操作：
```rust
pub enum Operation {
   Mint {
      recipient: ActorId,
      amount: u128,
   },
   Burn {
      sender: ActorId,
      amount: u128,
   },
   Transfer {
      sender: ActorId,
      recipient: ActorId,
      amount: u128,
   },
   Approve {
      approved_account: ActorId,
      amount: u128,
   },
}
```

升级逻辑合约时，枚举操作可能会发生变化，这意味着负载结构也可能会发生变化。因此，主合约不知道负载结构的具体类型，而是将其作为字节数组发送（Vec<u8>).

消息期间只向存储合约发送一条消息。收到消息后，逻辑合约将有效负载从字节数组解码为预期的枚举操作。这允许逻辑合约根据特定操作类型（Mint、Burn 或 Transfer）处理消息
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/659e04ec-5170-485b-948d-3472f957e82f)

当传输发生在 2 个不同的存储之间时，合约的行为如下：

1. 逻辑合约将 DecreaseBalance 消息发送到存储合约。

2. 如果消息执行成功，则逻辑合约将消息 IncreaseBalance 发送到另一个存储合约。否则，逻辑合约保存失败状态并回复主合约。

3. 如果消息 IncreaseBalance 执行成功，则逻辑合约保存状态并回复主合约。如果在存储合约中执行  IncreaseBalance 期间 gas 用完，则逻辑合约将状态保存为 DecreaseSuccess。这个状态在 handle_signal 函数中是不可追踪的。

如果交易执行不成功，则可能是由于合约内存出现问题。逻辑合约必须跟踪存储合约并重新运行任何失败的交易以防止失败。如果错误仍然存在，则应退还余额。

### 主合约架构

主合约的状态包括以下字段：
- 合约管理员的地址。他有升级逻辑合约的权利。
```rust
admin: ActorId,
```

-   逻辑合约的地址
```rust
ft_logic_id: ActorId,
```

-   交易历史。
```rust
transactions: HashMap<H256, TransactionStatus>
```
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/4b93f94e-c36c-4ef5-bdb4-4b6fcd2d61a6)

其中 TransactionStatus:
```rust
pub enum TransactionStatus {
   InProgress,
   Success,
   Failure,
}
```

合约从具有特定随机数的帐户接收消息，该随机数用于计算交易哈希以及帐户地址。用户有责任跟踪他们的随机数并在每次后续交易中增加它。但是，可以以自动跟踪用户随机数的方式设计合约，使随机数字段成为可选的。

主合约只是将该消息重定向到逻辑合约，指示向其发送消息的帐户。

**任务**

在此作业中，你将向你的 Tamagotchi 智能合约添加功能，以允许更改所有权并授权其他帐户更改所有权。这将涉及实现以下功能：
- Transfer(new_owner) - 该操作必须将字段所有者更改为指定的帐户；

- Approve(allowed_account) - 该操作必须填写指定帐户的 approved_account 字段；

- RevokeApproval - 该操作删除当前的 approved_account。

将你的合约上传到区块链，运行前端应用程序并选择第三课。

为确保你的合约与前端应用程序兼容，请确保将元数据设置为以下内容：
```rust
pub struct ProgramMetadata;

impl Metadata for ProgramMetadata {
   type Init = InOut<String, ()>;
   type Reply = InOut<(), ()>;
   type Others = InOut<(), ()>;
   type Signal = ();
   type Handle = InOut<TmgAction, TmgEvent>;
   type State = Tamagotchi;
}

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
}

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
}

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
}
```
