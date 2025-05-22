module friend_list::friend_list {
    // use sui::object::{Self, UID, ID};
    // use sui::tx_context::{Self, TxContext};
    // use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::bag::{Self, Bag};
    use sui::balance;
    // use std::option::{Self, Option};
    // use std::vector;
    // use sui::dynamic_field as df;

    // Error codes
    const EALREADY_EXISTS: u64 = 0;
    const ENOT_OWNER: u64 = 1;
    const EFRIEND_ALREADY_ADDED: u64 = 2;
    const EFRIEND_NOT_FOUND: u64 = 3;
    const EMAX_FRIENDS_EXCEEDED: u64 = 4;
    const ENAME_TOO_LONG: u64 = 5;
    const EINSUFFICIENT_BALANCE: u64 = 6;
    const EINVALID_AMOUNT: u64 = 7;

    // Constants
    const MAX_FRIENDS: u64 = 100;
    const MAX_NAME_LENGTH: u64 = 50;
    const MAX_MEMO_LENGTH: u64 = 200;

    // Registry object (shared)
    public struct FriendListRegistry has key {
        id: UID,
        lists: Table<address, ID>,
    }

    public struct Friend has store, drop, copy {
        addr: address,
        name: String,
        timestamp: u64,
    }

    public struct PaymentRecord has store, drop, copy {
        from: address,
        amount: u64,
        memo: String,
        timestamp: u64,
    }

    public struct FriendList has key {
        id: UID,
        owner: address,
        friends: Bag,
        friend_count: u64,
        payments: Table<address, vector<PaymentRecord>>,
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

    public struct PaymentSent has copy, drop {
        from: address,
        to: address,
        amount: u64,
        memo: String,
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
            payments: table::new(ctx),
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

    public entry fun pay_friend(
        friend_list: &mut FriendList,
        friend_addr: address,
        payment: Coin<SUI>,  // Changed to by-value
        amount: u64,
        memo: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(coin::value(&payment) >= amount, EINSUFFICIENT_BALANCE);
        assert!(friend_list.owner == sender, ENOT_OWNER);
        assert!(bag::contains(&friend_list.friends, friend_addr), EFRIEND_NOT_FOUND);
        assert!(amount > 0, EINVALID_AMOUNT);
        assert!(string::length(&memo) <= MAX_MEMO_LENGTH, ENAME_TOO_LONG);

        let timestamp = tx_context::epoch(ctx);

        // Split into payment and remainder
        let mut payment = payment;  // Make mutable
        let payment_coin = coin::split(&mut payment, amount, ctx);
        
        // Transfer both coins
        transfer::public_transfer(payment_coin, friend_addr);
        transfer::public_transfer(payment, sender);  // Remaining balance

        // Record payment (unchanged)
        let payment_record = PaymentRecord {
            from: sender,
            amount,
            memo: copy memo,
            timestamp,
        };

        if (!table::contains(&friend_list.payments, friend_addr)) {
            let mut payment_history = vector::empty<PaymentRecord>();
            vector::push_back(&mut payment_history, payment_record);
            table::add(&mut friend_list.payments, friend_addr, payment_history);
        } else {
            let payment_history = table::borrow_mut(&mut friend_list.payments, friend_addr);
            vector::push_back(payment_history, payment_record);
        }
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

    public fun get_payment_history(
        friend_list: &FriendList,
        friend_addr: address
    ): Option<vector<PaymentRecord>> {
        if (table::contains(&friend_list.payments, friend_addr)) {
            let history = table::borrow(&friend_list.payments, friend_addr);
            // Create a new vector and copy the elements
            let mut result = vector::empty<PaymentRecord>();
            let mut i = 0;
            while (i < vector::length(history)) {
                let record = vector::borrow(history, i);
                let copied_record = PaymentRecord {
                    from: record.from,
                    amount: record.amount,
                    memo: copy record.memo,
                    timestamp: record.timestamp,
                };
                vector::push_back(&mut result, copied_record);
                i = i + 1;
            };
            option::some(result)
        } else {
            option::none()
        }
    }
}
