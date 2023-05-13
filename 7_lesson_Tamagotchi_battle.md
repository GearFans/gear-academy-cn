Lesson 7 : The Tamagotchi Battle Logic & Implementation

Lesson Summary

-   This lesson focuses on the contract that facilitates battles between
      two Tamagotchis.

-   The battle contract can be in one of four states: Registration,
      Moves, Waiting, and GameIsOver.

-   The Battle struct contains information about the players, the
      current state of the game, the current turn, the Tamagotchi store
      ID, the winner, and the number of steps taken so far.

-   To participate in the game, users must allow their contracts to
      receive game-related messages like TmgAction::TmgInfo and
      StoreAction::GetAttributes.

-   The register function obtains information about the Tamagotchi owner
      and its attributes from the shop, generates the Tamagotchi's power
      and energy randomly, and registers the Tamagotchi.

-   The get_owner and get_attributes functions retrieve information
      about the Tamagotchi's owner and attributes from the store,
      respectively, while the get_turn and generate_power functions
      generate pseudo-random numbers to determine who starts the game
      and the Tamagotchi's power, respectively.

Lesson Objectives

By the end of the lesson, you will:

-   Understand the contract that facilitates battles between two
      Tamagotchi.

-   Understand the information contained in the Battle struct, such as
      player information, game state, winner, and number of steps taken
      so far.

-   Comprehend the battle contract states and understand their functions

-   Know the functions used to retrieve information from the store and
      generate pseudo-random numbers, such as get_owner, get_attributes,
      get_turn, and generate_power.

-   Complete the simple realization of the battle between Tamagotchi

Let’s get started!

The battle contract can be in 3 states:

-   Registration: the battle contract is waiting for the Tamagotchi
      owner to register them;

-   Move: the Tamagotchi owners are making the move in turns;

-   Waiting: after the Tamagotchi owners made their moves, the battle
      contract gives them time to equip their Tamagotchi.

-   GameIsOver: the battle is over, it’s necessary to send a message
      StartNewGame.

[Code Placeholder]

The battle program state:

[Code Placeholder]

Where the players are the following structs:

[Code Placeholder]

To participate, users must allow their contracts to receive game-related
messages as below:

[Code Placeholder]

To which it will respond with information about tamagotchi owner:

[Code Placeholder]

We’ll also add the message

[Code Placeholder]

To the store contract that allows us to get attributes of Tamagotchi

[Code Placeholder]

The register function:

It allows the registration of two Tamagotchi for battle.

[Image Placeholder]

1.  Before you register a Tamagotchi, the Battle contract must receive
      the Tamagotchi’s owner and its attributes from the shop;

2.  After receiving the details, the Battle contract randomly generates
      the Tamagorchi’s power and energy;

3.  If one Tamagotchi is registered, it remains in the Registration
      state;

4.  If two Tamagotchi are registered, the battle contract randomly
      determines who starts playing first and goes to the Moves state.

[Code Placeholder]

The get_owner function retrieves the Tamagotchi's owner from the
Tamagotchi contract.

[Code Placeholder]

Similarly, the get_attributes function retrieves the Tamagotchi's
attributes from the shop.

[Code Placeholder]

To determine which player starts the game, we use the get_turn function,
which pseudorandomly selects the starting player :

[Code Placeholder]

The genetate_power function pseudorandomly generates a power value for
the Tamagotchi:

[Code Placeholder]

There are also two constants, MAX_POWER and MIN_POWER, that define the
upper and lower bounds of the Tamagotchi's power:

[Code Placeholder]

Next, as an example, we will define a very simple game mechanic:

1.  The Tamagotchi owner makes a move by simply sending a message
      BattleAction::Move to the battle contract. During that move, their
      Tamagotchi beats the opponent’s Tamagotchi. The opponent’s energy
      decreases by the force of its strike.

2.  Now, there is only one attribute in the Tamagotchi store that can be
      used in the game - a sword. If the attacking Tamagotchi has a
      sword, the force of its strike is multiplied by SWORD_POWER:

  SWORD_POWER * power

Otherwise Tamagochi's strike power is simply their power.

In the future, you can expand the logic by adding fighting attributes to
the store, as well as adding the movement of the Tamagotchi across the
field.

3.  If both players have made three moves, the game enters a waiting
      state, and the players can equip their Tamagotchis with items from
      the shop. After a set delay, the Tamagotchis' states are updated,
      and the next round begins.

[Image Placeholder]

[Code Placeholder]

The UpdateInfo action just updates the changes in Tamagotchi states and
starts the next round:

[Code Placeholder]

So, we have finished the simple realization of the battle between
Tamagotchi.

You can try to take part in the battle with your Tamagochi or create
some Tamagotchi (using the previous lesson) and make them fight (Link to
web application).

Now it’s time for your coursework.

Coursework:

-   Add more fighting attributes to the store contract;

-   Determine the power of these attributes. You can also add the
      opportunity to upgrade various attributes (That will also require
      extending the logic of the store contract);

-   Allow the player to choose which weapon he will fight or defend
      during the turn;

-   It is also possible to add the ability to Tamagotchi to move left or
      right;

-   Be creative and think about other possible ways to make the game
      more interesting.
