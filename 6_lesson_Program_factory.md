  Lesson 6: Implementing the Program Factory for Multiple Escrow Smart
  Contracts

Lesson Summary

-   In the previous (2^(nd)) tutorial, we created an escrow smart
      contract that facilitated an agreement between two parties.

-   However, the escrow contract became useless after the deal was over
      and had to be initialized again for new deals with new parties.

-   In this tutorial, we’ll learn how to write an Escrow Factory smart
      contract that creates multiple instances of the escrow contract
      template from the previous tutorial.

-   The Escrow Factory smart contract eliminates the need to upload and
      initialize the same escrow contract template for every new deal.

-   Finally, we’ll test the Escrow Factory smart contract by deploying
      it to the blockchain and creating multiple escrow contract
      instances using the factory.

Lesson Objectives

By the end of this lesson, you should:

-   Understand how to create a factory smart contract

-   Explain how to initialize a new contract instance using a factory
      contract

-   Demonstrate how to test a factory smart contract

-   Understand the concept of a factory contract and how it can be used
      to deploy new instances of a contract.

-   Understand how to interact with the Escrow Factory contract to
      create new instances of the Escrow contract for different parties.

Let’s get started!

[Image Placeholder]

Coding Practice to Create Escrow Factory

Our Escrow Factory will store the number of created escrow contracts,
the mapping from the escrow id to its program address, and also the
CodeId of the escrow smart contract. :

[Code Placeholder]

The CodeId is a hash of the escrow program uploaded into the chain. That
hash will be used to create instances of escrow smart contracts.

Let's define the functionality of our loan factory program. It will
deploy an escrow contract and send messages about deposit and delivery
confirmation to the escrow.

[Code Placeholder]

As you can see, the Escrow contract will interact with Buyer and Seller
through Escrow Factory contract, meaning the Escrow Factory contract
will send messages to the Escrow contract.

Firstly, we have to define an io crate for the Escrow contract. Then
we’ll modify the structure of incoming messages and Escrow methods. Try
to change it yourself and then compare it with the correct
implementation (link).

After that, we’ll define Loan Factory methods and write the handle
function:

[Code Placeholder]

Let’s implement the create_escrow function.

For the program deployment we should import ProgramGenerator from the
prog module in gstd library:

[Code Placeholder]

To create a new contract instance, we will use the
create_program_with_gas_for_reply function. Here are the required
parameters:

-   The code hash of the uploaded program code

-   Payload for initialization message

-   Gas for the program creation (calculate in advance how much the
      initialization of the program loaded on the network requires)

-   Value attached to the init message

[Code Placeholder]

In our Escrow factory smart contract, we use asynchronous program
creation to ensure the program is initialized without errors. Since the
factory program waits for a reply, we add a reply message to the program
initialization.

Other methods are implemented easily since all logic and all checks are
included in the Escrow contract:

[Code Placeholder]

We move the msg::send_for_reply_as to a separate function to send
messages to the Escrow program for better readability.

[Code Placeholder]

With the factory loan contract finished, we’ll now test our factory
contract.

  Testing the Escrow Factory Functionality

Before testing the Escrow Factory smart contract, we need to set up the
environment. Here's how:

-   Upload the code of the Escrow contract:

[Code Placeholder]

Continue to test the contract as you learnt in previous lessons.

Assignment:

-   Finish tests for the Escrow factory;

-   Write the contract that will create Tamagotchi from your contract
      template.

  [Image Placeholder]
