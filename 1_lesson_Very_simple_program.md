Lesson 1: Creating the First Smart Contract Program - Hello World

Lesson Summary:

-   We will create our first smart contract program called "Hello
      World."

-   Learn how to initialize a program and define the entry point for
      message processing.

-   Add complexity to the program by restricting the type of messages it
      can receive and creating different greetings for different
      accounts, depending on the message.

-   Explore testing smart contracts to ensure they work as intended.

-   Learn how to read the program's state to retrieve important
      information.

Lesson Objectives:

By the end of the lesson, we will have:

-   Defined the steps involved in creating a simple smart contract
      program named "Hello World."

-   Explained the process of initializing a smart contract and defining
      the entry point for message processing.

-   Identified different ways of restricting the type of messages a
      smart contract can receive, and how to create different greetings
      for different accounts based on the message received.

-   Demonstrated how to test a smart contract program to ensure it
      functions correctly.

-   Described the process of reading a smart contract's state to
      retrieve important information.

-   Summarized the key concepts and building blocks required to develop
      functional smart contract programs.

Let’s get started Implementing our First Program!

Let’s implement the program that’ll send a hello message in response to
any received messages.

To get started, we'll create a new project using the following command:

[Code Placeholder]

This will create a directory structure for our project with the
following files:

[Code Placeholder]

Next, we need to add the necessary dependencies to our Cargo.toml file.
We'll use

-   gstd - a standard library for smart contracts on Gear

-   gtest - a library for testing smart contracts

-   gear-wasm-builder - a helping module that aids in building programs
      using Gear.

[Code Placeholder]

Now, let's write the minimum structure of our Gear program in the lib.rs
file. The handle function is the program's entry point. It will be
called every time the program receives an incoming message.

[Code Placeholder]

To build our program, we’ll create build.rs file with the following
code:

[Code Placeholder]

We can now run the following command to build our project:

[Code Placeholder]

gstd::msg is the messaging module from the gstd library, allowing users
to process incoming messages, obtain the necessary information about the
sender or the message content, and send replies or new messages to other
actors (link to gstd).

We'll use the reply function that sends a new message as a reply to the
message currently being processed:

[Code Placeholder]

Let's build our project:

[Code Placeholder]

If everything goes well, your working directory should now have a target
directory that resembles this:

[Code Placeholder]

The target/wasm32-unknown-unknown/release directory should contain three
WASM binaries:

-   hello_world.wasm is the output WASM binary built from source files;

-   hello_world.opt.wasm is the optimized WASM aimed to be uploaded to
    the blockchain;

-   hello_world.meta.wasm is the WASM containing meta information needed
    to interact with the program.

Before we upload our program to the blockchain, we need to understand
the metadata and *.meta.wasm file's use case. In the context of Gear
programs, metadata facilitates the interaction between the client-side
(JavaScript) and the program (Rust).

Metadata can be used as a message payload description for external tools
and applications that interact with Gear programs in the network. It is
stored in a separate *.meta.wasm file.

The Gear `metadata!` macro exports functions from Rust with IO data
specified by the user in the macro. In our example, we only need to
declare a type for the handle output message:

[Code Placeholder]

We've learned how to create a simple smart contract program that
responds with a "Hello" message to any incoming message. Let's test our
program.

Testing smart contract with gtest library

Testing smart contracts is an important aspect of developing
decentralized applications. We’ll use the Gear gtest library for our
program’s logic testing.

To get started, let's create a new directory called "tests" at the top
level of our project directory, next to the "src" director. In that
directory, we’ll create a file hello_world_test.rs where we’ll write
tests for our contract.

[Code Placeholder]

In our test file, we’ll need to import the necessary modules from the
gtest library, which are import Log, Program and System. We’ll also
define a test function:

[Code Placeholder]

Before testing our smart contract, we need to initialize the environment
for running programs. We can do this using the System module from gtest.
The system emulates the node behaviour:

[Code Placeholder]

Next, we need to initialize our program. We can do this using the
Program module from gtest. There are two ways to initialize a program:
from a file or the current program:

To initialize a program from a file:

[Code Placeholder]

To initialize a program from the current program:

[Code Placeholder]

The uploaded program has its own id. You can specify the program id
manually using the from_file_with_id constructor. If you don't specify
the program id, the id of the first initialized program will be
0x01000…, and the next program initialized without an id specification
will have an id of 0x02000... and so on.

In the next step, we’ll send messages to our program.

-   To send a message to the program, call one of two program functions:
      send() or send_bytes(). The difference between them is similar to
      gstd functions msg::send and msg::send_bytes.

-   The first argument in these functions is a sender id, the second one
      is a message payload.

-   The sender id can be specified as hex, array ([u8, 32]), string or
      u64. However, you can’t send a message from the id already taken
      by the program!

-   The first message to the initialized program structure is always the
      init message even if the program does not have the init function.
      In our case, it can be any message. But let’s add the init
      function to our program and monitor if that message reaches the
      program:

[Code Placeholder]

In our test function, we can send a message to the program using the
`send()` function:

[Code Placeholder]

Note that we added sys.init_logger() to initialize printing logs into
stdout, and we sent a message from the user with id 2 (id 2 transforms
to 0x020000.. ActorId).

We can then run our test using the following command:

[Code Placeholder]

If everything is working correctly, we should see the debug message in
our console:

[Code Placeholder]

Sending functions in the gtest library will return RunResult structure.
It contains the final result of the processing message and others, which
were created during the execution.

For example, we can check the init message processing result. We can do
this by ensuring that the log is empty and that the program does not
reply or send any messages. To do this, we can use the
assert!(res.log().is_empty()) command.

-   Contains empty log (the program doesn’t reply and does not send any
    messages);

[Code Placeholder]

-   Was successful:

[Code Placeholder]

Once we have confirmed that the initialization message was successful,
the next messages will be processed through the handle function. We can
test this by sending the next message using the program.send(2,
String::from("HANDLE MESSAGE")) command.

[Code Placeholder]

Here, we should check that the program replied with the expected hello
message. To do this, we can use the Log structure from the gtest lib and
build the log we are expecting to receive. Specifically, we can use the
Log::builder().dest(2).payload(String::from("Hello")) command to create
the expected log.

After creating the expected log, we can then check if the received log
contains the expected log. We can do this by using the
assert!(res.contains(&expected_log)) command.

[Code Placeholder]

As you might guess, dest is the actor to which the program sends a
message and payload is the content of that message.

Run the test and make sure that everything is fine.

Lesson 1 Quiz: Testing Your Understanding

1.  Consider the following program:

[Code Placeholder]

  We’ll test the program using the following test suite:

[Code Placeholder]

What will be the result of running that test?

-   Everything will be fine: the test will pass;

-   The test will fail because the first message to the initialized
    program structure is always the init message.

-   The test will fail because the expected_log does not contain the
    payload with “Hello”.

2.  What is the mistake in writing that test?

[Code Placeholder]

- The first message should be sent to the first initialized program;

-   You can not initialize two identical programs;

-   The message to the program_2 is sent from the address that is
    already occupied by the program.

3.  What returns fn send() from the gtest library?

-   It returns the RunResult structure that contains the result of
    program execution;

-   It returns the Log structure that contains the information about the
    source, destination, and payload of messages that were sent during
    the program execution;

-   It returns the message that was sent back to the sender.

Advanced Hello World Program Concepts

Let’s add more functionality to our program by introducing two new
messages: SendHelloTo and SendHelloReply.

Our program will receive 2 messages:

-   SendHelloTo: having received this message, the program will send
    “hello” to the specified address;

-   SendHelloReply: the program replies with a “hello” message to the
    account that sent the current message.

As we saw from the previous lesson, we’ll have to decode the message the
program received. We’ll define an enum InputMessages that will be used
to decode the incoming message.

[Code Placeholder]

The SendHelloTo variant includes an ActorId field where the program will
send the hello message.

We also need to add derive macros #[derive(Encode, Decode, TypeInfo)] to
the enum for encoding and decoding in messages, and add appropriate
dependencies to the Cargo.toml file:

[Code Placeholder]

To initialize our program, we’ll define a static mutable variable
GREETING as an Option<String>.

[Code Placeholder]

Until the program is initialized, the GREETING equals None. After the
initialization, the GREETING will become Some(String).

[Code Placeholder]

Next, we’ll decode the incoming message in the handle function and
define the message the program received:

[Code Placeholder]

When the program receives SendHelloTo message, it sends a hello message
to the specified account through the send function. On the other hand,
when the contract receives a SendHelloReply message, it replies with a
greeting message.

Testing the Updated Smart Contract

First, we’ll test the SendHelloTo message. We define the account id that
will receive that message and check that in the result log there is a
message assigned to that account.

[Code Placeholder]

Understanding the program metadata and state

Metadata is a kind of interface map that helps transform a set of bytes
into an understandable structure. It determines how all incoming and
outgoing data will be encoded/decoded.

Metadata allows dApp’s parts - the smart contract and the client side
(JavaScript), to understand each other and exchange data.

To describe the metadata interface we use `gmeta` crate:

[Code Placeholder]

where:

-   Init - describes incoming/outgoing types for `init()` function.

-   Handle - describes incoming/outgoing types for `handle()` function.

-   Others - describes incoming/outgoing types for `main()` function in
      case of asynchronous interaction.

-   Reply - describes incoming/outgoing types of messages performed
      using the `handle_reply` function.

-   Signal - describes only the outgoing type from the program while
      processing the system signal.

-   State - describes the types for the queried State

It is necessary to describe all the types. If any of the endpoints is
missing in your program, you can use () instead.

Let's define metadata for our example. We’ll create a crate

hello-world-io in the directory of our hello-world program:

[Code Placeholder]

The Cargo.toml of this crate:

[Code Placeholder]

And in the lib.rs file, we’ll define an incoming message for the init
function, and the incoming and outcoming messages for the handle
function:

[Code Placeholder]

The input for init function is a String. The input for the handle
function is an enum InputMessage, and accordingly, the output is String.
The program state is also String (It is a set greeting).

It is possible to read the program state using the state function.
Reading State is a free function and does not require gas costs. Let’s
define this function in lib.rs file of the hello-world program:

[Code Placeholder]

To make it possible to verify metadata for a program, we’ll use the
metahash() function:

[Code Placeholder]

It’s necessary to add the hello-world-io crate to build-dependencies in
Cargo.toml in the hello-world program:

[Code Placeholder]

We also need to change the build.rs file using the following code:

[Code Placeholder]

After building the program, a meta.txt file will be generated as a
result of the smart-contract compilation. This metadata file can be used
in UI applications that will interact with this smart contract.

Uploading the program to the blockchain

The easiest way to upload the program is to use the “Upload program”
option in the Gear Idea portal - idea.gear-tech.io.

First, you need to create an account and connect to Gear Idea. Follow
the instructions provided at
https://wiki.gear-tech.io/docs/idea/account/create-account to create
your account.

Once you've logged in, you can select the network on which you want to
upload the program by clicking on the gear icon in the lower left corner
of the screen. For the Gear Academy workshop, select the workshop node
(wss://node-workshop.gear.rs:443) and click the "Switch" button.

Select the workshop node and click on the Switch button:

[Image Placeholder]

Next, select "Programs" in the left column and upload the hello.opt.wasm
file along with its metadata (meta.txt file).

[Image Placeholder]

Give your program a name, enter an incoming greeting message and click
on the Upload Program button.

If the program has successfully uploaded, you will see it in the
program.

[Image Placeholder]

You can now send messages to your program:

[Image Placeholder]

You can also read the program state (It’s our greeting string that was
set during the program initialization).

[Image Placeholder]

Assignment:

Let's write a smart contract for a Tamagotchi game:

-   Create a smart contract Tamagotchi, that will store Tamagotchi’s
    name and date of birth. he state of your contract should be defined
    as follows:

[Code Placeholder]

-   During initialization, set the name and date of birth of the
    Tamagotchi and send a reply confirming successful initialization.

-   Your Tamagochi program should accept the following messages:

    -   Name - the program answers the name of the Tamagochi;

    -   Age - the program answers about the age of the Tamagochi.

-   Add the state function to your program.

-   Upload your contract to the workshop node at the
      https://idea.gear-tech.io/.

To connect your Tamagotchi contract to the frontend application, you
need to ensure that the metadata is as follows:

[Code Placeholder]

}

Clone the repository:
https://github.com/gear-dapps/smart-contract-academy

In the frontend directory, run the following commands:

[Code Placeholder]

The .env.local file contains the following:

[Code Placeholder]

It means that the application is running on the testnet node. You can
also run a local node, upload a Tamagotchi contract, and work with
contracts on a local node by indicating:

[Code Placeholder]

After running the yarn start, command you will see the following window:

[Image Placeholder]

Select Lesson 1, paste your Tamagotchi address and you’ll see your
Tamagotchi!

Please attach a link to the repo with your Tamagotchi contract.
