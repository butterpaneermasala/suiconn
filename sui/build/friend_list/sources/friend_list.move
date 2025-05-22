module friend_list::friend_list {
    // use sui::object::{Self, UID, ID};
    // use sui::tx_context::{Self, TxContext};
    // use sui::transfer;
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::bag::{Self, Bag};
    // use std::option::{Self, Option};

    // Error codes
    const EALREADY_EXISTS: u64 = 0;
    const ENOT_OWNER: u64 = 1;
    const EFRIEND_ALREADY_ADDED: u64 = 2;
    const EFRIEND_NOT_FOUND: u64 = 3;
    const EMAX_FRIENDS_EXCEEDED: u64 = 4;
    const ENAME_TOO_LONG: u64 = 5;

    // Constants
    const MAX_FRIENDS: u64 = 100;
    const MAX_NAME_LENGTH: u64 = 50;

    // Registry object (shared)
    public struct FriendListRegistry has key {
        id: UID,
        lists: Table<address, ID>,
    }

    public struct Friend has store, drop {
        addr: address,
        name: String,
        timestamp: u64,
    }

    public struct FriendList has key {
        id: UID,
        owner: address,
        friends: Bag,
        friend_count: u64,
    }

    // Events
    public struct FriendListCreated has copy, drop {
        owner: address,
        list_id: ID,
    }

    public struct FriendAdded has copy, drop {
        owner: address,
        friend_addr: address,
        friend_name: String,
        timestamp: u64,
    }

    public struct FriendRemoved has copy, drop {
        owner: address,
        friend_addr: address,
        timestamp: u64,
    }

    fun init(ctx: &mut TxContext) {
        let registry = FriendListRegistry {
            id: object::new(ctx),
            lists: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public entry fun create(
        registry: &mut FriendListRegistry,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            !table::contains(&registry.lists, sender),
            EALREADY_EXISTS
        );

        let friend_list = FriendList {
            id: object::new(ctx),
            owner: sender,
            friends: bag::new(ctx),
            friend_count: 0,
        };

        let list_id = object::id(&friend_list);
        table::add(&mut registry.lists, sender, list_id);
        transfer::transfer(friend_list, sender);
        
        event::emit(FriendListCreated {
            owner: sender,
            list_id,
        });
    }

    public entry fun add_friend(
        friend_list: &mut FriendList,
        new_friend_addr: address,
        new_friend_name: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(friend_list.owner == sender, ENOT_OWNER);
        assert!(string::length(&new_friend_name) <= MAX_NAME_LENGTH, ENAME_TOO_LONG);
        assert!(friend_list.friend_count < MAX_FRIENDS, EMAX_FRIENDS_EXCEEDED);
        assert!(
            !bag::contains(&friend_list.friends, new_friend_addr), 
            EFRIEND_ALREADY_ADDED
        );

        let _timestamp = tx_context::epoch(ctx);
        let new_friend = Friend {
            addr: new_friend_addr,
            name: new_friend_name,
            timestamp: _timestamp,
        };

        bag::add(&mut friend_list.friends, new_friend_addr, new_friend);
        friend_list.friend_count = friend_list.friend_count + 1;

        event::emit(FriendAdded {
            owner: sender,
            friend_addr: new_friend_addr,
            friend_name: new_friend_name,
            timestamp: _timestamp,
        });
    }

    public entry fun remove_friend(
        friend_list: &mut FriendList,
        friend_addr_to_remove: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(friend_list.owner == sender, ENOT_OWNER);
        assert!(
            bag::contains(&friend_list.friends, friend_addr_to_remove),
            EFRIEND_NOT_FOUND
        );
        
        let _friend: Friend = bag::remove<address, Friend>(&mut friend_list.friends, friend_addr_to_remove);
        friend_list.friend_count = friend_list.friend_count - 1;

        event::emit(FriendRemoved {
            owner: sender,
            friend_addr: friend_addr_to_remove,
            timestamp: tx_context::epoch(ctx),
        });
    }

    public fun get_friend_count(friend_list: &FriendList): u64 {
        friend_list.friend_count
    }

    public fun contains_friend(friend_list: &FriendList, addr: address): bool {
        bag::contains(&friend_list.friends, addr)
    }

    public fun get_owner(friend_list: &FriendList): address {
        friend_list.owner
    }

    public fun get_friend(friend_list: &FriendList, addr: address): Option<Friend> {
        if (bag::contains<address>(&friend_list.friends, addr)) {
            let friend_ref: &Friend = bag::borrow<address, Friend>(&friend_list.friends, addr);
            let result = Friend {
                addr: friend_ref.addr,
                name: copy friend_ref.name,
                timestamp: friend_ref.timestamp,
            };
            option::some(result)
        } else {
            option::none()
        }
    }

    public entry fun transfer_ownership(
        friend_list: &mut FriendList,
        new_owner: address,
        _ctx: &mut TxContext
    ) {
        friend_list.owner = new_owner;
    }

    // public entry fun clear_friends(
    // friend_list: &mut FriendList,
    // ctx: &mut TxContext
    // ) {
    //     let sender = tx_context::sender(ctx);
    //     assert!(friend_list.owner == sender, ENOT_OWNER);

    //     // Move old Bag out and destroy it
    //     let old_bag = friend_list.friends; // Move operation (not copy)
    //     bag::destroy_empty(old_bag);       // Proper resource cleanup

    //     // Create and assign new empty Bag
    //     friend_list.friends = bag::new(ctx);  // Move new Bag into struct
    //     friend_list.friend_count = 0;

    //     // Emit event with placeholder address (consider adding a dummy address)
    //     event::emit(FriendRemoved {
    //         owner: sender,
    //         friend_addr: address::zero(),  // Use zero address as placeholder
    //         timestamp: tx_context::epoch(ctx)
    //     });
    // }

}
