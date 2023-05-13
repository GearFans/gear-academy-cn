Lesson 5: Implementing Auction Functions in Smart Contracts

Lesson Summary

-   This lesson provides a step-by-step guide to implementing the
      English auction model in a Tamagotchi auction contract.

-   We’ll cover automatic program execution to facilitate the English
      auction model

-   We’ll highlight the contract state and logic required for the
      auction function

-   Expect hands-on development of the auction function solutions

Lesson Objectives

By the end of this lesson, you will:

-   Comprehend automatic program execution with smart contract
      automation

-   Understand the smart contract state and logic when implementing
      auction functions

-   Understand system signals, gas reservations, and how to add gas
      reservations to system signals

-   Incorporate an auction model to your smart contracts

Let’s Get Started!

In this lesson, we'll create a contract where users can put their
Tamagotchi up for auction. We'll implement the English auction model.

This type of auction starts with the declaration of the minimum bid,
which the Tamagotchi owner sets. After this, the interested bidders
start placing their bids in ascending order, i.e., the next bid should
be higher than the previous one. This process continues until there is a
bid above which any other buyer is not interested in buying Tamagotchi.
The highest bid is the selling price of Tamagotchi.

As you might guess, your Tamagotchi contract should be extended with
functionality that will make it possible to change ownership (it's
exactly your homework from the previous lesson).

During the auction, the auction contract temporarily becomes the owner
of Tamagotchi. After the auction ends, the contract appoints the new
owner of Tamagotchi - the winner of the auction. If no bids were made,
Tamagotchi is returned to the previous owner.

Automatic program execution with smart contract automation

Before we start coding the auction smart contract, we'll discuss smart
contract automation.

Smart contracts cannot auto-execute. Their code will not run and make
state changes on blockchain until triggered by an on-chain transaction.
The external transaction serves as a “poke” to wake the smart contract
up and initiate its logic. For example, we can start the auction by
sending a message to the auction contract.

When the auction time has passed, it's necessary to process the result
of the auction. However, the result will not be processed until someone
sends an appropriate message to the contract.

In Gear, we solve that problem with delayed messages.

[Code Placeholder]

The delayed message is executed after the indicated delay. It's quite
convenient in our case: we can start the auction by sending a message to
the auction contract. After completing all the necessary logic, the
auction contract will send a delayed message to itself, which will
settle the auction after the indicated time.

So, the ability to send delayed messages allows you to automate the
contract execution. The contract can self-execute an unlimited block
number provided there’s enough gas for execution. But the execution can
be interrupted if the gas runs out.

Gear protocol allows another powerful feature - gas reservation. A
developer can reserve gas that can be used to send usual or delayed
messages.

To reserve the amount of gas for further usage use the following
function:

[Code Placeholder]

That function takes some defined amount of gas from the amount available
for this program and reserves it. A reservation gets a unique identifier
used by a program to get this reserved gas and use it later.

You also have to indicate the block count within which the reserve must
be used. Gas reservation is not free: the reservation for one block
costs 100 gas. The reserve function returns ReservationId, used for
sending a message with that gas. To send a message using the reserved
gas:

[Code Placeholder]

If gas is not needed within the reservation period, it can be unreserved
and the gas will be returned to the user who made the reservation.

[Code Placeholder]

Understanding contract state and logic

Let’s start coding the auction contract. First we define the structure
of the contract state:

-   Tamagotchi_id - the address of the Tamagotchi contract that is
      currently on auction;

-   status - the status of auction (It can be ReadyToStart or
      InProcess);

-   current_bid - the current highest bid;

-   current_bidder - the address of the participant who made the highest
      bid at the moment;

-   ended_at -the time of the end of the auction;

-   prev_tmg_owner - the previous owner of the Tamagotchi (the auction
      contract has to store this account in case if no one is
      participating in the auction and Tamagotchi must be returned to
      the previous owner).

[Code Placeholder]

Let's define the messages that the contract will receive:

-   StartAuction {Tamagotchi_id, minimum_bid, duration} - message
      initiating the start of the auction. The Tamagotchi owner must
      indicate the address of the Tamagotchi contract, the starting
      price and the duration of the auction;

-   MakeBid { bid } - the message from auction participants, to which
      they must indicate the price (bid) they are ready to pay for
      Tamagotchi;

-   SettleAuction - the message that the contract receives after the end
      of the auction. If there were bids, then the auction contract
      assigns Tamagotchi to the auction winner. Otherwise, the auction
      contract assigns Tamagotchi to the previous owner.

[Code Placeholder]

As you can guess, the auction contract will interact with the fungible
token contract as well as with the Tamagotchi contract. That is, it'll
send messages to these contracts and wait for replies. Therefore, the
transactions will not be atomic and we’ll have to consider this to
maintain the state of 3 contracts consistent.

Let's look at each action of the contract in detail. The action
StartAuction has to change the owner of Tamagotchi to the auction
contract and set the auction parameters.

We consider all the possible cases that can lead to state inconsistency.
The auction contract sends a message to the Tamagotchi contract and the
following cases are possible:

1.  The Tamagotchi contract fails during the message execution either
      from lack of gas or from a logical error. It didn’t save the state
      and therefore auction and Tamagotchi are in a consistent state,
      however, the auction contract has no idea what happened in the
      Tamagotchi contract.

2.  The Tamagotchi executes the messages, and saves the state but gas
      runs out during further operations. Then, the state of the
      Tamagotchi contract changed, however, this was not reflected in
      the auction contract.

[Image Placeholder]

The workflow of MakeBid action is as follows:

1.  User makes a bid, indicating the number of tokens he would like to
      pay for Tamagotchi.

2.  The contract transfers his tokens to its balance and if that
      transfer is successful it returns the tokens to the previous
      bidder. The gas can run out during token contract execution,
      during a reply to the auction contract or during further
      execution.

  [Image Placeholder]

Having received the SettleAuction message, the contract performs the
following actions:

1.  Change the Tamagotchi owner to the auction winner. The gas can run
      out during the Tamagotchi contract execution, during a reply or
      during further auction contract execution.

2.  Transfer tokens to the previous owner. And again, the gas can run
      out during the fungible contract execution, during a reply or
      during further auction contract execution.

[Image Placeholder]

So, let’s create the following Enum for tracking transactions:

[Code Placeholder]

and add the fields to the contract state:

[Code Placeholder]

where the field transaction_id will be used for tracking the
transactions in the fungible token contract.

Practicing Contract coding

In this tutorial, instead of using panic!, we'll return
Result<AuctionEvent, AuctionError>. Panics use is convenient when the
execution of the contract is atomic and there are no asynchronous calls
in it.

In our case, there will be quite a few asynchronous messages between
which we must carefully track the state of the program. In such a case,
using Result enum is the preferred option.

We'll create enums AuctionEvent and AuctionError that we'll expand
during the writing of the program.

[Code Placeholder]

Accordingly, the main function:

[Code Placeholder]

Let’s start writing the function start_auction:

[Code Placeholder]

We check that auction is in ReadyToStart state:

[Code Placeholder]

Then we check if there is a pending transaction. If there is, we:

-   Check that it’s the transaction StartAuction;

-   Check the input arguments for the function. If they differ from
      those stored in the transaction, the contract replies with the
      error;

-   Get the Tamagotchi owner. If it's already the auction contract, we
      don’t send the message to the Tamagotchi contract again and just
      save it in the auction contract. Then we stop the message
      execution.

[Code Placeholder]

Where the function for getting owner:

[Code Placeholder]

And the function for changing owner:

[Code Placeholder]

If there is no a pending transaction, the following logic is simple:

[Code Placeholder]

As you can see, the code is repeated when we continue the previous
transaction or execute the current one.

Let’s write the function complete_tx:

[Code Placeholder]

Then the function start_auction will be rewritten as follows

[Code Placeholder]

Great, we're done with this function and now we'll start writing the
function for making bids:

1.  First, we check if there is no pending transaction MakeBid;

2.  Next, we check the input arguments. If they differ from those saved
      in transactions, we complete the previous transaction and execute
      the current one. If they are the same, we complete the pending
      transaction and stop the function execution.

3.  If there is no pending transaction, we execute the current
      transaction.

[Code Placeholder]

Let’s expand the function complete_tx:

[Code Placeholder]

So, the next step is writing the function settle_auction. And again,
here, we check the presence of a pending transaction.

But it's possible that there is a transaction MakeBid left from the
state when users were making bids.

In this case, we must first complete this transaction and then execute
the transaction SettleAuction:

[Code Placeholder]

And accordingly, the complete_tx function:

[Code Placeholder]

  System signals

In Gear programs, there are three common entry points: init, handle, and
handle_reply. The Gear Protocol also introduces the handle_signal entry
point, which enables the system to communicate with programs and notify
them (signal) of events related to the program's messages. Only the
system (Gear node runtime) can send signal messages to a program.

The system sends messages to a program if some errors during program
execution occurred. For example, a program can panic or run out of gas.

The gstd library provides a separate function for reserving gas
specifically for system signal messages.

[Code Placeholder]

This cannot be used for sending other regular cross-actor messages.
While signals can be used for inter-actor communication, they are not
suitable for sending regular cross-actor messages.

Signal messages use gas that is specifically reserved for them. If no
gas has been reserved for system messages, they will be skipped, and the
program will not receive them.

If gas has been reserved but no system messages occur during the current
execution, then this gas returns back from where it was taken.

If your program uses asynchronous messages and the #[gstd::async_main]
macro is used to expand the handle_signal entrypoint, it will free up
resources occupied by the program.

In Gear, using custom async logic involves storing Futures in the
program's memory. The execution context of these Futures can occupy a
significant amount of memory, especially when dealing with many Futures.

It's important to note that if a program sends a message and waits for a
reply, but the reply is unable to be received, it could be due to a lack
of gas. For example, if the initial message in the waitlist runs out of
gas or the gas amount is insufficient, the reply cannot be received.

To handle signals in your program, you can define your own
my_handle_signal entrypoint and write custom logic for it. In the next
section, we'll see an example of how to write this function in the
auction contract.

Adding gas reservation and system signals

Let’s add the entrypoint my_handle_signal to our auction contract. That
function will confirm whether there is a pending transaction. If there
is, the function takes the gas reserved in advance and sends a message
CompleteTx using that gas.

First, we have to add an action for gas reservation by expanding the
enums AuctionAction and AuctionEvent:

[Code Placeholder]

We also need to add a field reservations to the Auction struct to save
the ids of gas reservations:

[Code Placeholder]

Next, we'll define the method make_reservation for the Auction struct:

[Code Placeholder]

Here, RESERVATION_AMOUNT and RESERVATION_DURATION are constants defined
as follows:

[Code Placeholder]

Then we have to add the action for completing the transaction.

We’ll add the action to enum AuctionAction using:

[Code Placeholder]

Where the transaction is an enum that we have defined before:

[Code Placeholder]

We’ll also extend the entrypoint main():

[Code Placeholder]

Let’s write the function my_handle_signal. This function is responsible
for checking if there is a pending transaction and if there is a gas
reservation available. If so, it sends a message CompleteTx using that
gas.

[Code Placeholder]

It's also necessary to reserve gas for system messages before every
transaction. Here’s how we’ll implement it:

[Code Placeholder]

Assignment:

In this assignment, you will add a new feature to your Tamagotchi
contract, which will allow it to send a delayed message to itself at a
specified interval to check its state. If the Tamagotchi is tired,
hungry, or not entertained, it should send a message to the user asking
for feeding or playing.

To implement this feature, you need to extend the Tamagotchi state with
the reservations field, as shown below:

[Code Placeholder]

Next, you need to add two new incoming messages to the TmgAction enum:
CheckState and ReserveGas, as shown below:

[Code Placeholder]

You also need to add three new outcoming messages to the TmgEvent enum:
FeedMe, PlayWithMe, and WantToSleep. If the Tamagotchi runs out of gas,
it should send the message MakeReservation asking the owner to reserve
gas to continue checking the state.

You should also add the outcoming message GasReserved to indicate a
successful gas reservation, as shown below:

[Code Placeholder]

So, the Tamagotchi must send a message to itself once in a certain time
interval. Define this interval and determine at what levels of fed,
slept or entertained the Tamagotchi will start sending messages.

Connect your Tamagotchi to the application and see how it communicates
with you!
