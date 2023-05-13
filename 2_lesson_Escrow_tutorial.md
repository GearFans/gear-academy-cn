Lesson 2: Building an Escrow Smart Contract

Lesson Summary:

-   Escrow smart contracts eliminate the need for traditional
      third-party intermediaries.

-   Smart contracts are encoded in blockchain, making them secure,
      transparent, and tamper-proof.

-   Participants learn to build an escrow smart contract using
      blockchain programming languages.

-   Testing and deploying an escrow smart contract on a blockchain
      platform is an essential aspect of our lesson.

Lesson Objective:

By the end of the lesson, you will:

-   Understand the concept of an escrow smart contract and how it works.

-   Gain hands-on experience in building an escrow smart contract.

-   Read program state using your own function.

-   Learn how to test an escrow smart contract

Let’s get started!

An Escrow is an arrangement for a third party to temporarily hold the
assets of a transaction. The assets are kept in the third party account
and are only released once all agreement terms are met. Using an escrow
account in a transaction adds safety for both parties.

[Image Placeholder]

Encoding an escrow smart contract into a blockchain enables the contract
to be securely executed without traditional third parties.

How an Escrow in Smart Contract Works

1.  The Buyer and Seller agree to the escrow terms. The Seller lists an
      item for sale, and the Buyer pays the price agreed upon.

2.  The Seller delivers the product, and the funds are held in the
      escrow smart contract until all conditions are met and the Buyer
      confirms receipt of the product.

3.  Once the Buyer approves the product, the funds will be automatically
      transferred to the Seller's digital wallet by the smart contract.

Escrow Project Coding Practice

Let’s create a new project with the following command:

[Code Placeholder]

We need to add the necessary dependencies to the Cargo.toml file and
create a build.rs file (similar to the hello-world lesson).

Our program must store several states to correctly execute the logic.
These states include the addresses of the buyer and seller, the product
price, and the transaction state.

1.  AwaitingPayment: Seller listed an item for sale but Buyer hasn’t
      sent funds yet;

2.  AwaitingDelivery: Buyer transferred the funds to the smart contract,
      Seller sent the product;

3.  Closed: The buyer confirmed the delivery and the Seller received the
      funds.

Let’s define these states in enum:

[Code Placeholder]

Next, let’s define the structure that will store all necessary states:

[Code Placeholder]

We also need a global variable that will undergo changes during the
contract execution. We'll use the `static mut` construct for this:

[Code Placeholder]

Until the program is initialized, the ESCROW value equals None. During
initialization, we will fill the Escrow structure with information, and
ESCROW will become Some(Escrow).

Here’s the full code with minimal Gear smart contract structure l:

[Code Placeholder]

Build the project with the cargo build --release command and ensure
everything works.

We’ll then describe and write the init function.

Let's define the InitEscrow message payload that will be sent during
initialization. This structure needs to implement the Encode and Decode
traits to be encoded and decoded, and also the TypeInfo trait for
reading state.

[Code Placeholder]

In the init function, we'll define the Buyer's and Seller's addresses,
as well as the product price. We'll load the message using msg::load()
and decode it using the InitEscrow structure. Then, we'll create a new
Escrow structure with the information and set the state to
EscrowState::AwaitingPayment. Finally, we'll set ESCROW to Some(escrow).

Let’s load the message in init function and define the contract state:

[Code Placeholder]

Now, we'll write the escrow contract logic. Our contract will handle the
following messages:

-   Message from Buyer with attached funds. The escrow contract checks
      that:

-   The escrow state is AwaitingPayment;

-   Sender’s address is equal to Buyer’s address;

-   The attached funds equal the product price.

Then, the contract sets the escrow state to AwaitingDelivery and sends
the reply about the successful fund deposit.

-   Message from Buyer confirming the receipt of the goods. The escrow
      contract checks that:

-   The escrow state is AwaitingDelivery;

-   The Sender’s address is equal to the Buyer’s address.

Then the contract sets the escrow state to Closed, sends funds to the
Seller, and sends the reply about successful escrow closure.

Great! Now, we need to declare the enums for incoming and outcoming
messages, methods for Escrow structure, and implement the handle
function.

[Code Placeholder]

Note that we have to implement the Default trait for the Escrow
structure. Let’s add the #[derive(Default)] above the Escrow structure
and implement that trait for the EscrowState enum:

[Code Placeholder]

Let’s implement the deposit method:

-   We’ll check that the contract state equals the AwaitingDelivery (For
      this, we have to add #[derive(Debug,PartialEq, Eq)] above the
      EscrowState enum):

[Code Placeholder]

-   Then check the sender account (To obtain ActorId of the account that
      sends the currently processing message we use the source()
      function from msg module in gstd library):

[Code Placeholder]

-   And also check the attached funds (To get the value attached to the
      message being processed we use the value() function from msg
      module in gstd library):

[Code Placeholder]

-   Finally, we change the escrow state and send a reply message:

[Code Placeholder]

Reading program state using your own function

In the previous lesson, we learnt how to read the full program state
using state function in the contract. Additionally, it's possible to
create your own library with functions to read the contract state.

Let’s extend the functionality of our escrow program by adding program
metadata. We’ll start by creating a crate escrow-io in the directory of
the escrow program:

[Code Placeholder]

The Cargo.toml file of that crate will contain the following:

[Code Placeholder]

Now we can move InitEscrow, EscrowAction, EscrowEvent, EscrowState and
Escrow to that crate and define the ProgramMetadata as follows:

[Code Placeholder]

To add a state function to the escrow-io crate, we include:

[Code Placeholder]

Add dependencies to Cargo.toml of the escrow program:

[Code Placeholder]

We’ll change the build.rs file:

[Code Placeholder]

And create an independent crate for reading state:

[Code Placeholder]

The Cargo.toml of this crate will contain the following:

[Code Placeholder]

In the lib.rs file, we should define metawasm trait as follows:

[Code Placeholder]

It’s also necessary to define the type of program state, which is the
Escrow type in this case. We can execute this by adding `type State =
Escrow;`:

[Code Placeholder]

Now that we've defined the trait and the state type, we can write any
functions we want that concern the Escrow state. For example:

[Code Placeholder]

Finally, we’ll create the build.rs file of the state as follows:

[Code Placeholder]

Once we've built the crate, we'll have a file called
escrow_state.meta.wasm that we can use in our UI applications to
interact with the smart contract.

Testing our Smart Contract Program

Let’s test our method.

We’ll first create the tests directory and escrow_test.rs file:

[Code Placeholder]

We’ll import necessary structures from gtest library and escrow crate
and define constants for Buyer, Seller and product price. Then, we’ll
send an init message using the following code :

[Code Placeholder]

Next, we’ll send a message from the Buyer’s account using the
send_with_value function instead of send function since we need to send
a message with funds. However, in the test node, the account balance is
zero, so we’ll have to change it:

[Code Placeholder]

To keep things organized, let's move the contract initialization into a
separate function called init_escrow(sys: &System):

[Code Placeholder]

We can use the get_program function from the gtest library to get the
program in the test function. As you remember from the first lesson, our
program is initialized with the first id. So, the full code of the
deposit test function is as follows:

[Code Placeholder]

At the end of the test, we’ll also check that the funds are credited to
the program using the balance_of function.

It's crucial to test the correct contract execution and the failed
cases. We have to check that the contract panics if:

-   The message was sent from the wrong account;

-   Buyer attached not enough funds;

-   The escrow state is not AwaitingPayment.

So, let’s test all panics in the deposit function:

[Code Placeholder]

Great, we have written half of our program. Now it's time for you to
code.

Assignment:

1.  Implement the confirm_delivery function. The function should:

-   Check that msg::source() is a buyer;

-   Check that the escrow state is AwaitingDelivery;

-   Sends the funds to the seller (use msg::send() function);

-   Set the escrow state to Closed;

-   Send a reply message about successful delivery confirmation.

2.  Write tests for the written function:

-   confirm_delivery test that tests the successful contract execution;

  Note that the contract sends a message with value to a seller and the
  user messages are stored in their individual mailbox. To get the value
  from these messages, it's necessary to claim the value from the
  mailbox.

  In gtest, you can use the function claim_value_from_mailbox. After
  claiming the value, check the seller's balance and make sure that
  funds were transferred to his account.

-   confirm_delivery_failures test that tests all panics in the escrow
      contract.

3.  Next, we return to the Tamagotchi contract you started writing in
      the previous lesson:

  Let’s expand the Tamagochi state by adding the following field to its
  structure:

-   The Tamagotchi owner (it can be an account that initializes the
      Tamagotchi contract);

-   Mood: Fed (from 1 to 10000), Happy (from 1 to 10000) and Rested(from
      1 to 10000). These values must be set to non-zero when
      initializing the Tamagotchi contract. Also, you should define the
      following constants:

  HUNGER_PER_BLOCK = 1: how much Tamagotchi becomes hungry for the
  block;

  ENERGY_PER_BLOCK = 2 - how much Tamagotchi loses energy per block;

  BOREDOM_PER_BLOCK = 2 - how bored Tamagotchigetsper block;

  FILL_PER_SLEEP = 1000 - how much energy Tamagotchi gets per sleep;

-   FILL_PER_FEED = 1000 - how much Tamagotchi becomes full during
      feeding;

-   FILL_PER_ENTERTAINMENT = 1000 - how much Tamagotchi becomes happy
      during feeding;

-   The Tamagotchi also has to accept messages: Sleep, Feed and Play;

-   Think of logic for calculating the levels of Fed, Happy and Rested.
      You need to take into account the numbers of blocks in which the
      Tamagotchi last ate, had fun or slept. For this you can use the
      function block_timestamp() from the module exec of gstd library.

4.  Now upload your contract to the blockchain and run the frontend
      application. Choose the second lesson.

  Now you can feed your Tamagotchi, play with it and send it to sleep.

  The metadata must meet the following requirements to ensure the
  contract aligns with the frontend:

[Code Placeholder]

Please attach a link to the repo with your Tamagotchi contract.
