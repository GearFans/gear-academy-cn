## 第 1 课：创建第一个智能合约程序 - Hello World

### 课程总结：

-   我们将创建我们的第一个“Hello World”智能合约程序。

-   了解如何初始化程序并定义消息处理的入口函数。

-   通过限制程序可以接收的消息类型并根据消息为不同的帐户创建不同的问候语来增加程序的复杂性。

-   探索测试智能合约以确保它们按预期工作。

-   了解如何读取程序的状态以检索重要信息。

### 课程目标：

在课程结束时，我们将拥有：

-   定义了创建名为“Hello World”的简单智能合约程序所涉及的步骤。

-   解释了初始化智能合约和定义消息处理入口函数的过程。

-   确定了限制一个智能合约可以接收的消息类型的不同方式，以及如何根据收到的消息为不同的帐户创建不同的问候语。

-   演示了如何测试智能合约程序以确保其正常运行。

-   描述了读取智能合约状态以检索重要信息的过程。

-   总结了开发功能性智能合约程序所需的关键概念和构建区块。

**让我们开始构建第一个程序吧！**

让我们实现发送问候语以响应任何接收到的消息的程序。

首先，我们将使用以下命令创建一个新项目：

```
cargo new hello-world --lib
```
这将为我们的项目创建一个目录结构，其中包含以下文件：

```
└── hello-world
    ├── Cargo.toml
    └── src
        └── lib.rs
```

接下来，我们需要将必要的依赖项添加到我们的 Cargo.toml 文件中。我们将使用

-   gstd - Gear 智能合约的标准库

-   gtest - 用于测试智能合约的库

-   gear-wasm-builder - 一个帮助使用 Gear 构建程序的模块。

```
[package]
name = "hello-world"
version = "0.1.0"
edition = "2021"

[dependencies]
gstd = { git = "https://github.com/gear-tech/gear.git", features = ["debug"] }

[build-dependencies]
gear-wasm-builder = { git = "https://github.com/gear-tech/gear.git" }

[dev-dependencies]
gtest = { git = "https://github.com/gear-tech/gear.git" }
```

现在，让我们在 lib.rs 文件中编写 Gear 程序的最小结构。handle 函数是程序的入口函数。每次程序收到传入消息时都会调用该函数。

```rust
#![no_std]
use gstd::{msg, prelude::*};

#[no_mangle]
unsafe extern "C" fn handle() {}
```

为了构建我们的程序，我们将使用以下代码创建 build.rs 文件：

```rust
fn main() {
    gear_wasm_builder::build();
}
```

现在可以运行以下命令来构建我们的项目：

```
cargo build  --release
```

gstd::msg 是 gstd 库中的消息传递模块，允许用户处理传入的消息，获取有关发件人或消息内容的必要信息，并向其他 actor 发送回复或新消息（链接到 gstd）。

我们将使用发送新消息的 reply 函数作为对当前正在处理的消息的回复：
```rust
#![no_std]
use gstd::{msg, prelude::*};

#[no_mangle]
unsafe extern "C" fn handle() {
    msg::reply(String::from("Hello"), 0).expect("Error in sending a reply message");
}
```

让我们开始构建项目：
```
cargo build  --release
```

如果一切顺利，你的工作目录现在应该有一个类似于以下内容的目标目录：
```
target
    ├── release
    │   └── ...
    └── wasm32-unknown-unknown
        └── release
            ├── ...
            ├── hello_world.wasm      <---- this is our built .wasm file
            ├── hello_world.opt.wasm  <---- this is optimized .wasm file
            └── hello_world.meta.wasm <---- this is meta .wasm file
```

target/wasm32-unknown-unknown/release 目录应该包含三个 WASM 二进制文件：

-   hello_world.wasm 是从源文件构建的 output WASM 二进制文件；

-   hello_world.opt.wasm 是优化后的 WASM，旨在上传到区块链；

-   hello_world.meta.wasm 是包含与程序交互所需的 meta 信息的 WASM。

在我们将程序上传到区块链之前，我们需要了解 metadata 和 *.meta.wasm 文件的用例。在 Gear 程序中，metadata 促进了客户端 (JavaScript) 和程序 (Rust) 之间的交互。

元数据可用作与网络中的 Gear 程序交互的外部工具和应用程序的消息负载描述。它存储在一个单独的 *.meta.wasm 文件中。

**Gear metadata! 宏从 Rust 中导出了用户在宏中指定的 IO 数据函数。** 在我们的示例中，我们只需要为 handle 输出消息声明一个类型：
```rust
gstd::metadata! {
    title: "Hello world contract",
    handle:
        output: String,
}
```

我们已经学习了如何创建一个简单的智能合约程序，该程序以“Hello”消息响应任何传入消息。让我们测试一下我们的程序。

## 使用 gtest 库测试智能合约

测试智能合约是开发去中心化应用程序的一个重要方面。我们将使用 Gear gtest 库进行程序的逻辑测试。

首先，让我们在项目目录的顶层，“src”目录旁边创建一个名为“tests”的新目录。在该目录中，我们将创建一个 hello_world_test.rs 文件，我们将在其中为合约编写测试。
```
mkdir tests
touch hello_world_test.rs
```

在我们的测试文件中，我们需要从 gtest 库中导入必要的模块，即 import *Log*、*Program* 和 *System*。我们还将定义一个测试函数：

```rust
use gtest::{Log, Program, System};

#[test]
fn hello_test() {}
```

在测试我们的智能合约之前，我们需要初始化运行程序的环境。我们可以使用 gtest 的系统模块来做到这一点。系统模拟节点行为：
```rust
let sys = System::new();
```

接下来，我们需要初始化我们的程序。我们可以使用 gtest 的 Program 模块来做到这一点。初始化程序有两种方法：从文件或当前程序：

从文件初始化程序：
```rust
let program = Program::from_file(&sys,
    "./target/wasm32-unknown-unknown/release/hello_world.wasm");
```

从当前程序初始化程序：
```rust
let program = Program::current(&sys);
```

上传的程序有自己的 id。您可以使用 from_file_with_id 构造函数手动指定程序 ID。如果不指定程序 id，第一个初始化程序的 id 为 0x01000...，下一个没有指定 id 的初始化程序 id 为 0x02000...，依此类推。

在下一步中，我们将向程序发送消息。

- 要向程序发送消息，请调用两个程序函数之一：send() 或 send_bytes()。它们之间的区别类似于 gstd 函数 msg::send 和 msg::send_bytes。

- 这些函数中的第一个参数是发送者 ID，第二个参数是消息负载。

- 发件人 ID 可以指定为十六进制、数组 ([u8, 32])、字符串或 u64。但是，你不能从程序已占用的 id 发送消息！

- 即使程序没有 init 函数，初始化程序结构的第一条消息也始终是 init 消息。在我们的范例中，它可以是任何消息。但是让我们将 init 函数添加到我们的程序中并监控该消息是否到达程序：
```rust
#![no_std]
use gstd::{msg, prelude::*, debug};

#[no_mangle]
unsafe extern "C" fn handle() {
    msg::reply("Hello", 0).expect("Error in sending a reply message");
}

#[no_mangle]
unsafe extern "C" fn init() {
    let init_message: String = msg::load().expect("Can't load init message");
    debug!("Program was initialized with message {:?}", init_message);
}
```

在我们的测试函数中，我们可以使用以下函数向程序发送消息 `send()` 函数：
```rust
#[test]
fn hello_test() {
    let sys = System::new();
    sys.init_logger();
    let program = Program::current(&sys);
    program.send(2, String::from("INIT MESSAGE"));
}
```

请注意，我们添加了 sys.init_logger() 以将打印日志初始化到 stdout，并且我们发送了一条来自 ID 2 的用户的消息（ID 2 转换为 0x020000.. ActorId）。

然后我们可以使用以下命令运行测试：
```
cargo test --release
```

如果一切正常，我们会在控制台中看到调试消息：
```
[DEBUG hello_test] Program was initialized with message "INIT MESSAGE"
test hello_test ... ok
```

gtest 库中的 Sending 函数将返回 RunResult 结构。它包含处理消息的最终结果和其他在执行期间创建的消息。

比如我们可以查看 init 消息处理结果。我们可以通过确保日志为空并且程序不回复或发送任何消息来做到这一点。为此，我们可以使用 assert!(res.log().is_empty()) 命令。

- 包含空日志（程序不回复也不发送任何消息）；
```rust
assert!(res.log().is_empty());
```

- 成功：
```rust
assert!(!res.main_failed());
```

一旦我们确认初始化消息成功，接下来的消息将通过句柄函数处理。我们可以通过使用 program.send(2, String::from("HANDLE MESSAGE"))
命令发送下一条消息来测试这一点。
```rust
let res = program.send(2, String::from("HANDLE MESSAGE"));
```

在这里，我们应该检查程序是否回复了预期的问候消息。为此，我们可以使用 gtest 库中的日志结构并构建我们期望接收的日志。具体来说，我们可以使用 Log::builder().dest(2).payload(String::from("Hello")) 命令来创建预期的日志。

创建预期日志后，我们可以检查接收到的日志是否包含预期日志。我们可以使用 assert!(res.contains(&expected_log)) 命令来做到这一点。

```rust
let expected_log = Log::builder().dest(2).payload(String::from("Hello"));
assert!(res.contains(&expected_log));
```

您可能会猜到，dest 是程序向其发送消息的参与者，有效负载是该消息的内容。

运行测试并确保一切正常。

## 第 1 课测验：测试你的理解力

1.  考虑以下程序：
```rust
#![no_std]
use gstd::{msg, prelude::*, debug};

#[no_mangle]
unsafe extern "C" fn handle() {
    msg::reply("Hello", 0).expect("Error in sending a reply message");
}
```
我们将使用以下测试套件测试该程序：
```rust
#[test]
fn hello_test() {
    let sys = System::new();
    let program = Program::current(&sys);
    let res = program.send(2, String::from("Hello"));
    let expected_log = Log::builder().dest(2);
    assert!(res.contains(&expected_log));
}
```

运行该测试的结果是什么？

- 一切顺利：测试会通过；

- 测试将失败，因为初始化程序结构的第一条消息始终是初始化消息。

- 测试将失败，因为 expected_log 不包含带有“Hello”的有效负载。

2.  编写该测试的错误是什么？
```rust
#[test]
fn hello_test() {
    let sys = System::new();
    let program_1 = Program::current(&sys);
    let program_2 = Program::current(&sys);
    let res = program_2.send(2, String::from("Hello"));
    assert!(res.log().is_empty());
}
```

- 第一条消息应该发送给第一个初始化的程序；

- 你不能初始化两个相同的程序；

- 发给 program_2 的消息是从程序已经占用的地址发出的。

3. 从 gtest 库返回 fn send() 的结果是什么？

- 它返回包含程序执行结果的 RunResult 结构；

- 它返回 Log 结构，其中包含有关程序执行期间发送的消息的源、目标和有效负载的信息；

- 它返回发送回发件人的消息。

### 高级 Hello World 程序概念

让我们通过引入两条新消息来为我们的程序添加更多功能：SendHelloTo 和 SendHelloReply。

我们的程序将收到 2 条消息：

- SendHelloTo：收到这条消息后，程序将向指定地址发送“hello”；

- SendHelloReply：程序用“hello”消息回复发送当前消息的帐户。

正如我们在上一课中看到的，我们必须对程序收到的消息进行解码。我们将定义一个用于解码传入消息的枚举 InputMessages。
```rust
#[derive(Encode, Decode, TypeInfo)]
enum InputMessages {
    SendHelloTo(ActorId),
    SendHelloReply,
}
```

SendHelloTo 变体包含一个 ActorId 字段，程序将在其中发送问候消息。

我们还需要在枚举中添加派生宏#[derive(Encode, Decode,TypeInfo)]，用于消息中的编码和解码，并在 Cargo.toml 文件中添加适当的依赖项：
```rust
codec = { package = "parity-scale-codec", version = "3.1.2", default-features = false, features = ["derive", "full"] }
scale-info = { version = "2.0.1", default-features = false, features = ["derive"] }
```

为了初始化我们的程序，我们将定义一个静态可变变量 GREETING 作为一个 Option .
```rust
static mut GREETING: Option<String> = None;
```

在程序初始化之前，GREETING 等于 None。初始化后，GREETING 会变成 Some(String)。
```rust
#[no_mangle]
unsafe extern "C" fn init() {
   let greeting = String::from_utf8(msg::load_bytes().expect("Can't load init message"))
       .expect("Invalid message");
   debug!("Program was initialized with message {:?}", greeting);
   GREETING = Some(greeting);
}
```

接下来，我们将解码 handle 函数中的传入消息并定义程序接收到的消息：
```rust
#[no_mangle]
unsafe extern "C" fn handle() {
   let input_message: InputMessages = msg::load().expect("Error in loading InputMessages");
   let greeting = GREETING.get_or_insert(Default::default());
   match input_message {
       InputMessages::SendHelloTo(account) => {
           debug!("Message: SendHelloTo {:?}", account);
           msg::send(account, greeting, 0)
               .expect("Error in sending Hello message to account");
       }
       InputMessages::SendHelloReply => {
           debug!("Message: SendHelloReply");
           msg::reply(greeting, 0).expect("Error in sending reply");
       }
   }
}
```

程序收到 SendHelloTo 消息后，通过 send 函数向指定账号发送 hello 消息。另一方面，当合约收到 SendHelloReply 消息时，它会回复一条问候消息。

### 测试更新后的智能合约

首先，我们将测试 SendHelloTo 消息。我们定义将接收该消息的帐户 ID，并检查结果日志中是否有分配给该帐户的消息。
```rust
use gtest::{Log, Program, System};
use hello_world::InputMessages;

#[test]
fn hello_test() {
    let sys = System::new();
    sys.init_logger();
    let program = Program::current(&sys);
    let res = program.send(2, String::from("INIT MESSAGE"));
    assert!(!res.main_failed());
    assert!(res.log().is_empty());

    // test `SendHelloTo`
    let hello_recipient: u64 = 4;
    let res = program.send(2, InputMessages::SendHelloTo(hello_recipient.into()));
    let expected_log = Log::builder()
        .dest(hello_recipient)
        .payload(String::from("Hello"));
    assert!(res.contains(&expected_log))
```

### 了解程序元数据和状态

元数据是一种接口映射，有助于将一组字节转换为可理解的结构。它决定了所有传入和传出数据的编码/解码方式。

元数据允许 dApp 的部分——智能合约和客户端 (JavaScript) 相互理解并交换数据。

我们使用 crate 来描述元数据接口 gmeta：
```rust
use gmeta::{InOut, Metadata};
pub struct ProgramMetadata;
impl Metadata for ProgramMetadata {
    type Init = InOut<MessageInitIn, MessageInitOut>;
    type Handle = InOut<MessageIn, MessageOut>;
    type Others = InOut<MessageAsyncIn, Option<u8>>;
    type Reply = InOut<String, Vec<u16>>;
    type Signal = ();
    type State = Vec<u128>;
}
```

位置：

- Init - 描述 init() 函数的传入/传出类型。

- 句柄 - 描述 handle() 函数的传入/传出类型。

- 其他 - 描述 main() 异步交互情况下函数的传入/传出类型。

- 回复 - 描述使用该功能执行的传入/传出消息类型 handle_reply。

- 信号 - 仅描述处理系统信号时从程序传出的类型。

- State - 描述查询状态的类型

需要描述所有类型。如果你的程序中缺少任何端点，您可以使用 () 代替。

让我们为示例定义元数据。我们将创建一个 crate hello-world-io 在我们的 hello-world 程序的目录中：
```
cargo new hello-world-io --lib
```

这个 crate 的 Cargo.toml：
```
[package]
name = "hello-world-io"
version = "0.1.0"
edition = "2021"

[dependencies]
gmeta = {  git = "https://github.com/gear-tech/gear.git" }
gstd = { git = "https://github.com/gear-tech/gear.git" }
codec = { package = "parity-scale-codec", version = "3.1.2", default-features = false, features = ["derive", "full"] }
scale-info = { version = "2.0.1", default-features = false, features = ["derive"] }
```

在 lib.rs 文件中，我们将为 init 函数定义传入消息，为 handle 函数定义传入和传出消息：

```rust
#![no_std]

use codec::{Decode, Encode};
use gmeta::{InOut, Metadata};
use gstd::{prelude::*, ActorId};
use scale_info::TypeInfo;
pub struct ProgramMetadata;

impl Metadata for ProgramMetadata {
   type Init = InOut<String, ()>;
   type Handle = InOut<InputMessages, String>;
   type Reply = InOut<(), ()>;
   type Others = InOut<(), ()>;
   type Signal = ();
   type State = String;
}

#[derive(Encode, Decode, TypeInfo)]
pub enum InputMessages {
   SendHelloTo(ActorId),
   SendHelloReply,
}
```

init 函数的输入是一个字符串。handle 函数的输入是枚举 InputMessage，因此输出是 String。程序状态也是 String（一组问候语）。

可以使用状态函数读取程序状态。Reading State 是一项免费功能，不需要 gas 费用。让我们在 hello-world 程序的 lib.rs 文件中定义这个函数：
```rust
#[no_mangle]
extern "C" fn state() {
   let greeting = unsafe {
        GREETING.get_or_insert(Default::default())
   };
   msg::reply(greeting, 0).expect("Failed to share state");
}

```

为了能够验证程序的元数据，我们将使用 metahash() 函数：
```rust
#[no_mangle]
// It returns the Hash of metadata.
// .metahash is generating automatically while you are using build.rs
extern "C" fn metahash() {
   let metahash: [u8; 32] = include!("../.metahash");
   msg::reply(metahash, 0).expect("Failed to share metahash");
}
```

有必要在 hello-world 程序的 Cargo.toml 中将 hello-world-io crate 添加到 build-dependencies 中：
```
[package]
name = "hello-world"
version = "0.1.0"
edition = "2021"
...
[build-dependencies]
gear-wasm-builder = { git = "https://github.com/gear-tech/gear.git" }
hello-world-io = { path = "hello-world-io" }
```

我们还需要使用以下代码更改 build.rs 文件：
```
use hello_world_io::ProgramMetadata;
fn main() {
   gear_wasm_builder::build_with_metadata::<ProgramMetadata>();
}
```

构建程序后，将生成一个 meta.txt 文件作为智能合约编译的结果。此元数据文件可用于将与此智能合约交互的 UI 应用程序。

### 将程序上传到区块链

上传程序最简单的方法是使用 Gear Idea - idea.gear-tech.io 中的“上传程序”选项。

首先，你需要创建一个帐户并连接到 Gear Idea。按照 https://wiki.gear-tech.io/docs/idea/account/create-account 中提供的说明创建您的帐户。

登录后，你可以通过单击屏幕左下角的 gear 图标来选择要上传程序的网络。对于 Gear Academy Workshop，选择 workshop 节点 (wss://node-workshop.gear.rs:443) 并单击“切换”按钮。

选择 workshop 节点，点击切换按钮：
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/90a6bd4a-8c47-44e8-a6e1-7baaff508be1)

接下来，在左侧栏中选择“程序”并上传 hello.opt.wasm 文件及其元数据（meta.txt 文件）。
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/fac0bd31-30ca-47df-9754-baa4785855f2)

为你的程序命名，输入传入的问候消息，然后单击“上传程序”按钮。

如果程序已成功上传，你将在程序中看到它。
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/fb0c3ba3-fa09-40ed-a3dd-8b116a0b48ff)

现在你可以向你的程序发送消息：
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/183726aa-bcdd-445b-8e99-2a78351b4cc5)

你还可以读取程序状态（这是我们在程序初始化期间设置的问候字符串）。
![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/b2ac2692-1444-461c-8f30-28ca4cf7001d)

### 任务：

让我们为 Tamagotchi 游戏编写智能合约：

- 创建一个智能合约 Tamagotchi，它将存储 Tamagotchi 的姓名和出生日期。你的合约状态应定义如下：
```rust
#[derive(Default, Encode, Decode, TypeInfo)]
pub struct Tamagotchi {
   name: String,
   date_of_birth: u64,
}
```

- 初始化时，设置电子宠物的姓名和出生日期，并发送确认初始化成功的回复。

- 你的 Tamagochi 程序应该接受以下消息：

    - 名称 - 程序回答 Tamagochi 的名称；

    - 年龄 - 该程序会回答 Tamagochi 的年龄。

- 将状态函数添加到你的程序中。

- 将你的合约上传到 https://idea.gear-tech.io/ 上的 workshop 节点。

将你的 Tamagotchi 合约连接到前端应用程序，你需要确保元数据如下：
```rust
pub struct ProgramMetadata;

impl Metadata for ProgramMetadata {
   type Init = InOut<String,()>;
   type Reply = InOut<(),()>;
   type Others = InOut<(),()>;
   type Signal = ();
   type Handle = InOut<TmgAction, TmgEvent>;
   type State = Tamagotchi;
}

#[derive(Encode, Decode, TypeInfo)]
pub enum TmgAction {
   Name,
   Age,
}

#[derive(Encode, Decode, TypeInfo)]
pub enum TmgEvent {
   Name(String),
   Age(u64),
}

#[derive(Default, Encode, Decode, TypeInfo)]
pub struct Tamagotchi {
   name: String,
   date_of_birth: u64,
```

}

克隆存储库：https://github.com/gear-dapps/smart-contract-academy

在前端目录中，运行以下命令：
```
yarn
yarn start
```

.env.local 文件包含以下内容：
```
REACT_APP_NODE_ADDRESS=wss://test-wss.gear.rs
```

这意味着应用程序正在测试网节点上运行。您还可以运行本地节点，上传 Tamagotchi 合约，并通过指示在本地节点上使用合约：
```
REACT_APP_NODE_ADDRESS=ws://localhost:9944
```

运行 yarn start 命令后，您将看到以下窗口：

![image](https://github.com/GearFans/gear-academy-cn/assets/100750671/5da1b95c-4ffc-4972-b266-82a7320daff8)

选择**第 1 课**，粘贴你的 Tamagotchi 地址，你将看到你的 Tamagotchi！

请在你的 Tamagotchi 合约中附上指向 repo 的链接。
