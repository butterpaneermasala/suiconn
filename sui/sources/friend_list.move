module friend_list::friend_list {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;
    use std::vector;
    use sui::table::{Self, Table};
    use sui::object::ID;


    // Error code for already existing FriendList
    const EALREADY_EXISTS: u64 = 0;

    struct FriendListRegistry has key {
        id: UID,
        lists: Table<address, ID>,
    }

    struct Friend has store {
        addr: address,
        name: String,
    }

    struct FriendList has key {
        id: UID,
        owner: address,
        friends: vector<Friend>,
    }

    /// Initialize FriendList for a user
    public entry fun create(
        registry: &mut FriendListRegistry,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        // Check if the user already has a FriendList
        assert!(
            !table::contains(&registry.lists, sender),
            EALREADY_EXISTS,
        );

        let friend_list = FriendList {
            id: object::new(ctx),
            owner: sender,
            friends: vector::empty<Friend>(),
        };

        // Add to registry
        table::add(&mut registry.lists, sender, object::id(&friend_list));
        transfer::transfer(friend_list, sender);
    }

    /// Add a friend to the list with name
    public entry fun add_friend(
        friend_list: &mut FriendList,
        new_friend_addr: address,
        new_friend_name: String,
        _ctx: &mut TxContext
    ) {
        vector::push_back(
            &mut friend_list.friends,
            Friend {
                addr: new_friend_addr,
                name: new_friend_name,
            }
        );
    }

    /// Get friends (view function)
    public fun get_friends(friend_list: &FriendList): &vector<Friend> {
        &friend_list.friends
    }
}
