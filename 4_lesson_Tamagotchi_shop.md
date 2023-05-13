Lesson 4: The Tamagotchi Shop Description

Lesson Summary:

-   The lesson covers how to create contracts for selling Tamagotchi
      using fungible tokens.

-   The Tamagotchi can have various attributes such as accessories,
      clothing, and weapons, which will be necessary for our upcoming
      Tamagotchi battle game.

-   To buy attributes, the Tamagotchi must have enough tokens in its
      balance, and it must approve the store's contract for transferring
      its tokens.

-   We’ll explore transaction handling and how to deal with transactions
      with errors during their execution.

Lesson Objective:

By the end of this lesson, users will:

-   Create a contract for selling Tamagotchi using fungible tokens

-   Connect the concept of fungible tokens (from Lesson 3) and their use
      in purchasing Tamagotchi attributes

-   Understand how to check Tamagotchi token balance and approve
      contracts for transferring tokens.

-   Understand how to handle incomplete transactions

Let’s get started!

The buying process involves three steps:

1.  The Tamagotchi sends a message to the fungible token contract to
      approve the store contract to transfer its tokens;

2.  The Tamagotchi sends a message to the store contract, indicating the
      attribute it wants to buy;

3.  The store contract sends a message to the fungible token contract to
      transfer the tokens to itself. If the tokens are successfully
      transferred, the store adds the attribute to the the Tamagotchi
      attributes.

[Image Placeholder]

Coding

Let's start writing the smart contract. First, we’ll define the
structure of the store contract state:

[Code Placeholder]

We’ll use type alias to improve the code readability:

[Code Placeholder]

The Metadata for the attribute contains the following fields:

[Code Placeholder]

Let’s define the actions that the store contract must execute:

-   The contract must create new attributes and sell them to the
      Tamagotchi contracts;

-   The contract must receive messages from the Tamagotchi contracts.

Before implementing these functions, we’ll define the contract store's
store-io crate and write the lib.rs file:

[Code Placeholder]

The store contract will accept two types of messages: CreateAttribute
and BuyAttribute. On successful message execution, it'll reply with
AttributeCreated or AttributeSold.

We’ll then write the basic structure of the program as follows:

[Code Placeholder]

The buy_attribute function is asynchronous since the store contract must
send a message to the token contract and wait for a reply from it.

Now, let's implement the create_attribute function. This function is
straightforward and performs the following steps:

-   Verifies that the account that sent the message is the contract
      admin.

-   Ensures that an attribute with the indicated ID doesn't already
      exist.

-   Creates a new attribute

-   Sends a reply indicating the successful creation of the attribute.

[Code Placeholder]

Next, let's dive into the implementation of the buy_attribute function.
As we discussed earlier, this function is responsible for initiating a
token transfer from the Tamagotchi contract to the store contract, and
it must track the transaction's ID in the fungible token contract. To
achieve this, we will add a new field called transaction_id to the store
contract's state.

So, the store contract is responsible for tracking the transactions in
the fungible token and has to consider the ID of the current transaction
in it. Let’s add the field transaction_id to the contract state:

[Code Placeholder]

This field will store the ID of the current transaction and will allow
the store contract to track the status of the token transfer with ease.
With this field in place, the buy_attribute function can initiate the
token transfer, track the transaction's ID, and wait for a reply from
the fungible token contract to confirm the transfer's success.

And we also declare the type for transaction id in the store-io crate:

[Code Placeholder]

Next, let’s assume the following situations:

[Image Placeholder]

1.  The Tamagotchi sends a message to the store contract to buy an
      attribute;

2.  The store contract sends a message to the fungible token contract
      and receives a reply about the successful token transfer;

3.  The store contract begins changing its state. It adds the indicated
      attribute to the Tamagotchi ownership but runs out of gas.

In such a scenario, the tokens were transferred to the store contracts
but the Tamagotchi didn’t receive its attribute. To prevent this, it's
important for the store contract to detect when a transaction is
incomplete and continue its execution accordingly.

Let’s add another field to the AttributeStore struct:

[Code Placeholder]

When the store contract receives a purchase message from a Tamagotchi,
it checks if the Tamagotchi is already involved in any incomplete
transactions.

If the Tamagotchi has an incomplete transaction, the store contract
retrieves the transaction number and attribute ID associated with the
transaction, and resumes the transaction.

If the previous message wasn’t completed, the Tamagotchi has to send
another identical message to complete the transaction. However, it's
possible that the Tamagotchi sends multiple purchase messages and fails
to notice that some messages did not go through.

To handle this, the store contract checks the attribute ID specified in
the current message and compares it with the attribute ID stored in
transactions. If the saved id is not equal to the indicated one, then
the store contract asks the Tamagotchi to complete the previous
transaction. Otherwise, it continues the pending transaction.

If the Tamagotchi has no pending transactions, then the store contract
increments the transaction_id and saves the transaction.

[Code Placeholder]

Note that you have to add CompletePrevTx event to StoreEvent to ensure
proper event tracking.

Let’s write the function for selling attributes. Selling attributes is
similar to executing the NFT transfer. We’ll assign the attribute ID to
the Tamagotchi contract.

First, we’ll write the function for the token transfer:

[Code Placeholder]

We’ve sent a message to the token contract and handled its reply. The
contract considers that the message to the token contract was
successfully processed only if it received the FTokenEvent::Ok.

Now, we’re ready to write the function for selling attributes:

[Code Placeholder]

First, the contract receives the attribute price, then it calls the
function transfer_tokens. If the result of the token transfer is
successful, it adds the attribute to the Tamagotchi contract.

Great! We’re done writing the contract logic.

Now, you should give your Tamagotchi the ability to buy attributes.

What we have learnt:

-   Communicating with the fungible token contract;

-   How to handle incomplete/imperfect transactions.

Homework:

-   Give the tokens to your Tamagotchi contract (here must be the link
      to the fungible token contract deployed on the testnet);

-   Add fields to the Tamagotchi contract that store the address of the
      fungible token contract;

-   Add the ability to approve to transfer its token (and accordingly
      the field transaction_id for communication with the fungible token
      contract);

-   Add the function buy_attribute to your Tamagotchi contract;

-   Buy attributes for your Tamagotchi and see how it's transforming.

For the contract to be in accordance with the frontend, the metadata
must be the following:

[Code Placeholder]
