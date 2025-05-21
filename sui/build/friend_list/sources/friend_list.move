module friend_list::friend_list {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;
// std is an alias for the standard library 0x1::std
    use std::vector;
    // Friend data structure
    struct Friend has store {
        addr: address,
        name: String
    }

    // FriendList object storing a user's friends
    struct FriendList has key {
        id: UID,
        owner: address,
        friends: vector<Friend>
    }

    // Initialize FriendList for a user
    public entry fun create(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let friend_list = FriendList {
            id: object::new(ctx),
            owner: sender,
            friends: vector::empty<Friend>()
        };
        transfer::transfer(friend_list, sender);
    }

    // Add a friend to the list with name
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
                name: new_friend_name
            }
        );
    }

    // Get friends (view function)
    public fun get_friends(friend_list: &FriendList): &vector<Friend> {
        &friend_list.friends
    }
}
