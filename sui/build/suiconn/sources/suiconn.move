module suiconn::suiconn {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::balance::{Self, Balance};
    use std::vector;
    use std::option::{Self, Option};
    use sui::clock::{Self, Clock};

    // Error codes
    const EALREADY_EXISTS: u64 = 0;
    const ENOT_OWNER: u64 = 1;
    const EFRIEND_ALREADY_ADDED: u64 = 2;
    const EFRIEND_NOT_FOUND: u64 = 3;
    const EMAX_FRIENDS_EXCEEDED: u64 = 4;
    const ENAME_TOO_LONG: u64 = 5;
    const EINSUFFICIENT_BALANCE: u64 = 6;
    const EINVALID_AMOUNT: u64 = 7;
    const EVECTOR_LENGTH_MISMATCH: u64 = 8;
    const EEMPTY_BATCH: u64 = 9;
    const EMAX_BATCH_SIZE_EXCEEDED: u64 = 10;
    const EUSERNAME_TAKEN: u64 = 11;
    const EUSER_NOT_FOUND: u64 = 12;
    const EREQUEST_ALREADY_EXISTS: u64 = 13;
    const EREQUEST_NOT_FOUND: u64 = 14;
    const EINVALID_REQUEST_STATUS: u64 = 15;
    const ESPLIT_PAYMENT_NOT_FOUND: u64 = 20;
    const EALREADY_PAID: u64 = 21;
    const EINVALID_SPLIT_AMOUNT: u64 = 22;
    const ENOT_FRIENDS: u64 = 25;
    const ESELF_FRIEND_REQUEST: u64 = 26;
    const EZERO_PARTICIPANTS: u64 = 29;
    const EOVERPAYMENT: u64 = 30;
    const ETOO_FREQUENT_PAYMENTS: u64 = 31;
    const EDAILY_LIMIT_EXCEEDED: u64 = 32;
    const EINVALID_USERNAME_CHARS: u64 = 33;

    // Constants
    const MAX_FRIENDS: u64 = 500;
    const MAX_USERNAME_LENGTH: u64 = 30;
    const MAX_MEMO_LENGTH: u64 = 200;
    const MAX_BATCH_SIZE: u64 = 50;
    const MAX_DAILY_PAYMENTS: u64 = 100;
    const MIN_PAYMENT_INTERVAL: u64 = 1000; // 1 second
    const DAY_IN_MS: u64 = 86400000; // 24 hours

    // Request Status
    const REQUEST_PENDING: u8 = 0;
    const REQUEST_ACCEPTED: u8 = 1;
    const REQUEST_REJECTED: u8 = 2;

    // Payment Types
    const PAYMENT_DIRECT: u8 = 0;
    const PAYMENT_SPLIT: u8 = 1;

    // Payment Status
    const PAYMENT_PENDING: u8 = 0;
    const PAYMENT_COMPLETED: u8 = 1;
    const PAYMENT_FAILED: u8 = 2;

    // Main Platform Registry (shared object) - fully decentralized
    public struct PlatformRegistry has key {
        id: UID,
        user_profiles: Table<address, UserProfile>,
        username_registry: Table<String, address>,
        friend_requests: Table<address, vector<FriendRequest>>,
        split_payments: Table<ID, SplitPayment>,
        batch_payments: Table<ID, BatchPayment>,
        payment_history: Table<address, vector<PaymentRecord>>,
        total_users: u64,
        platform_balance: Balance<SUI>,
    }

    // User Profile
    public struct UserProfile has store, copy, drop {
        username: String,
        address: address,
        friends: vector<address>,
        created_at: u64,
        last_payment_time: u64,
        daily_payment_count: u64,
        last_friend_request_time: u64,
        total_payments_sent: u64,
        total_payments_received: u64,
    }

    // Friend Request
    public struct FriendRequest has store, copy, drop {
        id: ID,
        from: address,
        to: address,
        status: u8,
        created_at: u64,
        updated_at: u64,
    }

    // Split Payment
    public struct SplitPayment has store, copy, drop {
        id: ID,
        creator: address,
        title: String,
        total_amount: u64,
        participants: vector<SplitParticipant>,
        created_at: u64,
        completed_at: Option<u64>,
        is_completed: bool,
        payment_deadline: Option<u64>,
        collected_amount: u64,
        recipient_address: address,
    }

    // Split Participant
    public struct SplitParticipant has store, copy, drop {
        address: address,
        amount_owed: u64,
        amount_paid: u64,
        has_paid: bool,
        paid_at: Option<u64>,
    }

    // Payment Record
    public struct PaymentRecord has store, copy, drop {
        id: ID,
        from: address,
        to: address,
        amount: u64,
        memo: String,
        payment_type: u8,
        related_id: Option<ID>,
        timestamp: u64,
        status: u8,
    }

    // Batch Payment
    public struct BatchPayment has store, copy, drop {
        id: ID,
        creator: address,
        payments: vector<BatchPaymentItem>,
        created_at: u64,
        completed_at: Option<u64>,
        is_completed: bool,
    }

    public struct BatchPaymentItem has store, copy, drop {
        to_username: String,
        amount: u64,
        memo: String,
        status: u8,
        completed_at: Option<u64>,
    }

    public struct BatchPaymentRequest has store, copy, drop {
        payments: vector<BatchPaymentItem>
    }

    // Events
    public struct UserRegistered has copy, drop {
        user_address: address,
        username: String,
        timestamp: u64,
    }

    public struct FriendRequestSent has copy, drop {
        request_id: ID,
        from: address,
        to: address,
        timestamp: u64,
    }

    public struct FriendRequestResponded has copy, drop {
        request_id: ID,
        from: address,
        to: address,
        status: u8,
        timestamp: u64,
    }

    public struct SplitPaymentCreated has copy, drop {
        split_id: ID,
        creator: address,
        total_amount: u64,
        participants_count: u64,
        recipient_address: address,
        timestamp: u64,
    }

    public struct SplitPaymentContribution has copy, drop {
        split_id: ID,
        contributor: address,
        amount: u64,
        timestamp: u64,
    }

    public struct PaymentSent has copy, drop {
        payment_id: ID,
        from: address,
        to: address,
        amount: u64,
        payment_type: u8,
        timestamp: u64,
    }

    public struct SplitPaymentCompleted has copy, drop {
        split_id: ID,
        recipient_address: address,
        total_amount: u64,
        completed_at: u64,
    }

    public struct BatchPaymentCreated has copy, drop {
        batch_id: ID,
        creator: address,
        total_payments: u64,
        total_amount: u64,
        timestamp: u64,
    }

    public struct BatchPaymentCompleted has copy, drop {
        batch_id: ID,
        creator: address,
        total_payments: u64,
        total_amount: u64,
        completed_at: u64,
    }

    // Initialize the platform - completely decentralized
    fun init(ctx: &mut TxContext) {
        let registry = PlatformRegistry {
            id: object::new(ctx),
            user_profiles: table::new(ctx),
            username_registry: table::new(ctx),
            friend_requests: table::new(ctx),
            split_payments: table::new(ctx),
            batch_payments: table::new(ctx),
            payment_history: table::new(ctx),
            total_users: 0,
            platform_balance: balance::zero(),
        };
        
        transfer::share_object(registry);
    }

    // Helper function to validate username characters
    fun is_valid_username(username: &String): bool {
        let username_bytes = string::bytes(username);
        let mut i = 0;
        while (i < vector::length(username_bytes)) {
            let byte = *vector::borrow(username_bytes, i);
            if (!((byte >= 48 && byte <= 57) ||  // 0-9
                  (byte >= 65 && byte <= 90) ||  // A-Z
                  (byte >= 97 && byte <= 122) || // a-z
                  byte == 95)) {                 // _
                return false
            };
            i = i + 1;
        };
        true
    }

    // User Registration
    public entry fun register_user(
        registry: &mut PlatformRegistry,
        username: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&registry.user_profiles, sender), EALREADY_EXISTS);
        assert!(string::length(&username) > 0, ENAME_TOO_LONG);
        assert!(string::length(&username) <= MAX_USERNAME_LENGTH, ENAME_TOO_LONG);
        assert!(!table::contains(&registry.username_registry, username), EUSERNAME_TAKEN);
        assert!(is_valid_username(&username), EINVALID_USERNAME_CHARS);

        let timestamp = clock::timestamp_ms(clock);
        let user_profile = UserProfile {
            username: copy username,
            address: sender,
            friends: vector::empty(),
            created_at: timestamp,
            last_payment_time: 0,
            daily_payment_count: 0,
            last_friend_request_time: 0,
            total_payments_sent: 0,
            total_payments_received: 0,
        };

        table::add(&mut registry.user_profiles, sender, user_profile);
        table::add(&mut registry.username_registry, username, sender);
        table::add(&mut registry.friend_requests, sender, vector::empty());
        table::add(&mut registry.payment_history, sender, vector::empty());
        registry.total_users = registry.total_users + 1;

        event::emit(UserRegistered {
            user_address: sender,
            username,
            timestamp,
        });
    }

    // Friend Request System
    public entry fun send_friend_request(
        registry: &mut PlatformRegistry,
        to_username: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(table::contains(&registry.username_registry, to_username), EUSER_NOT_FOUND);

        let to_address = *table::borrow(&registry.username_registry, to_username);
        assert!(sender != to_address, ESELF_FRIEND_REQUEST);

        let sender_profile = table::borrow_mut(&mut registry.user_profiles, sender);
        assert!(!vector::contains(&sender_profile.friends, &to_address), EFRIEND_ALREADY_ADDED);
        assert!(vector::length(&sender_profile.friends) < MAX_FRIENDS, EMAX_FRIENDS_EXCEEDED);

        let current_time = clock::timestamp_ms(clock);
        assert!(current_time - sender_profile.last_friend_request_time >= MIN_PAYMENT_INTERVAL, ETOO_FREQUENT_PAYMENTS);
        sender_profile.last_friend_request_time = current_time;

        // Check if request already exists
        let requests = table::borrow(&registry.friend_requests, to_address);
        let mut i = 0;
        while (i < vector::length(requests)) {
            let req = vector::borrow(requests, i);
            assert!(!(req.from == sender && req.status == REQUEST_PENDING), EREQUEST_ALREADY_EXISTS);
            i = i + 1;
        };

        let request_id = object::new(ctx);
        let friend_request = FriendRequest {
            id: object::uid_to_inner(&request_id),
            from: sender,
            to: to_address,
            status: REQUEST_PENDING,
            created_at: current_time,
            updated_at: current_time,
        };
        object::delete(request_id);

        let to_requests = table::borrow_mut(&mut registry.friend_requests, to_address);
        vector::push_back(to_requests, friend_request);

        event::emit(FriendRequestSent {
            request_id: friend_request.id,
            from: sender,
            to: to_address,
            timestamp: current_time,
        });
    }

    public entry fun respond_to_friend_request(
        registry: &mut PlatformRegistry,
        request_id: ID,
        accept: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.friend_requests, sender), EREQUEST_NOT_FOUND);

        let requests = table::borrow_mut(&mut registry.friend_requests, sender);
        let mut found_index = option::none<u64>();
        let mut i = 0;

        while (i < vector::length(requests)) {
            let req = vector::borrow(requests, i);
            if (req.id == request_id && req.status == REQUEST_PENDING) {
                found_index = option::some(i);
                break
            };
            i = i + 1;
        };

        assert!(option::is_some(&found_index), EREQUEST_NOT_FOUND);
        let index = option::extract(&mut found_index);
        let request = vector::borrow_mut(requests, index);

        let timestamp = clock::timestamp_ms(clock);
        let new_status = if (accept) REQUEST_ACCEPTED else REQUEST_REJECTED;
        request.status = new_status;
        request.updated_at = timestamp;

        let from_address = request.from;

        if (accept) {
            let sender_profile = table::borrow_mut(&mut registry.user_profiles, sender);
            vector::push_back(&mut sender_profile.friends, from_address);

            let from_profile = table::borrow_mut(&mut registry.user_profiles, from_address);
            vector::push_back(&mut from_profile.friends, sender);
        };

        event::emit(FriendRequestResponded {
            request_id,
            from: from_address,
            to: sender,
            status: new_status,
            timestamp,
        });
    }

    // Split Payment System
    public entry fun create_split_payment(
        registry: &mut PlatformRegistry,
        title: String,
        total_amount: u64,
        participants: vector<String>,
        recipient_address: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(total_amount > 0, EINVALID_AMOUNT);
        assert!(vector::length(&participants) > 0, EZERO_PARTICIPANTS);
        assert!(vector::length(&participants) <= MAX_BATCH_SIZE, EMAX_BATCH_SIZE_EXCEEDED);

        let split_amount = total_amount / vector::length(&participants);
        assert!(split_amount > 0, EINVALID_SPLIT_AMOUNT);

        let timestamp = clock::timestamp_ms(clock);
        let split_uid = object::new(ctx);
        let split_id = object::uid_to_inner(&split_uid);

        let mut split_participants = vector::empty();
        let mut i = 0;

        while (i < vector::length(&participants)) {
            let username = vector::borrow(&participants, i);
            assert!(table::contains(&registry.username_registry, *username), EUSER_NOT_FOUND);

            let participant_address = *table::borrow(&registry.username_registry, *username);
            let participant = SplitParticipant {
                address: participant_address,
                amount_owed: split_amount,
                amount_paid: 0,
                has_paid: false,
                paid_at: option::none(),
            };
            vector::push_back(&mut split_participants, participant);
            i = i + 1;
        };

        let split_payment = SplitPayment {
            id: split_id,
            creator: sender,
            title: copy title,
            total_amount,
            participants: split_participants,
            recipient_address,
            collected_amount: 0,
            created_at: timestamp,
            completed_at: option::none(),
            is_completed: false,
            payment_deadline: option::none(),
        };

        table::add(&mut registry.split_payments, split_id, split_payment);
        object::delete(split_uid);

        event::emit(SplitPaymentCreated {
            split_id,
            creator: sender,
            total_amount,
            participants_count: vector::length(&participants),
            recipient_address,
            timestamp,
        });
    }

    // Custom split payment with different amounts
    public entry fun create_custom_split_payment(
        registry: &mut PlatformRegistry,
        title: String,
        participants: vector<String>,
        amounts: vector<u64>,
        recipient_address: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(vector::length(&participants) == vector::length(&amounts), EVECTOR_LENGTH_MISMATCH);
        assert!(vector::length(&participants) > 0, EZERO_PARTICIPANTS);
        assert!(vector::length(&participants) <= MAX_BATCH_SIZE, EMAX_BATCH_SIZE_EXCEEDED);
        
        let mut total_amount = 0;
        let mut i = 0;
        while (i < vector::length(&amounts)) {
            let amount = *vector::borrow(&amounts, i);
            assert!(amount > 0, EINVALID_AMOUNT);
            total_amount = total_amount + amount;
            i = i + 1;
        };
        
        let timestamp = clock::timestamp_ms(clock);
        let split_uid = object::new(ctx);
        let split_id = object::uid_to_inner(&split_uid);
        
        let mut split_participants = vector::empty();
        i = 0;
        while (i < vector::length(&participants)) {
            let username = vector::borrow(&participants, i);
            let amount = *vector::borrow(&amounts, i);
            
            assert!(table::contains(&registry.username_registry, *username), EUSER_NOT_FOUND);
            let participant_address = *table::borrow(&registry.username_registry, *username);
            
            let participant = SplitParticipant {
                address: participant_address,
                amount_owed: amount,
                amount_paid: 0,
                has_paid: false,
                paid_at: option::none(),
            };
            vector::push_back(&mut split_participants, participant);
            i = i + 1;
        };
        
        let split_payment = SplitPayment {
            id: split_id,
            creator: sender,
            title: copy title,
            total_amount,
            participants: split_participants,
            recipient_address,
            collected_amount: 0,
            created_at: timestamp,
            completed_at: option::none(),
            is_completed: false,
            payment_deadline: option::none(),
        };

        table::add(&mut registry.split_payments, split_id, split_payment);
        object::delete(split_uid);

        event::emit(SplitPaymentCreated {
            split_id,
            creator: sender,
            total_amount,
            participants_count: vector::length(&participants),
            recipient_address,
            timestamp,
        });
    }

    public entry fun pay_split_amount(
        registry: &mut PlatformRegistry,
        split_id: ID,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.split_payments, split_id), ESPLIT_PAYMENT_NOT_FOUND);

        let split_payment = table::borrow_mut(&mut registry.split_payments, split_id);
        assert!(!split_payment.is_completed, EALREADY_PAID);

        let mut participant_index = option::none<u64>();
        let mut i = 0;
        while (i < vector::length(&split_payment.participants)) {
            let participant = vector::borrow(&split_payment.participants, i);
            if (participant.address == sender && !participant.has_paid) {
                participant_index = option::some(i);
                break
            };
            i = i + 1;
        };

        assert!(option::is_some(&participant_index), EUSER_NOT_FOUND);
        let index = option::extract(&mut participant_index);
        let participant = vector::borrow_mut(&mut split_payment.participants, index);

        assert!(coin::value(&payment) >= participant.amount_owed, EINSUFFICIENT_BALANCE);

        let amount_to_pay = participant.amount_owed;
        let mut payment_coin = payment;
        let split_coin = coin::split(&mut payment_coin, amount_to_pay, ctx);

        let payment_balance = coin::into_balance(split_coin);
        balance::join(&mut registry.platform_balance, payment_balance);
        
        transfer::public_transfer(payment_coin, sender);

        let timestamp = clock::timestamp_ms(clock);
        participant.amount_paid = amount_to_pay;
        participant.has_paid = true;
        participant.paid_at = option::some(timestamp);
        
        split_payment.collected_amount = split_payment.collected_amount + amount_to_pay;

        // Check if all participants have paid
        let mut all_paid = true;
        i = 0;
        while (i < vector::length(&split_payment.participants)) {
            let p = vector::borrow(&split_payment.participants, i);
            if (!p.has_paid) {
                all_paid = false;
                break
            };
            i = i + 1;
        };

        if (all_paid) {
            split_payment.is_completed = true;
            split_payment.completed_at = option::some(timestamp);
            
            let transfer_amount = split_payment.collected_amount;
            let transfer_balance = balance::split(&mut registry.platform_balance, transfer_amount);
            let transfer_coin = coin::from_balance(transfer_balance, ctx);
            
            transfer::public_transfer(transfer_coin, split_payment.recipient_address);
            
            event::emit(SplitPaymentCompleted {
                split_id,
                recipient_address: split_payment.recipient_address,
                total_amount: transfer_amount,
                completed_at: timestamp,
            });
        };

        // Record payment history
        let payment_uid = object::new(ctx);
        let payment_id = object::uid_to_inner(&payment_uid);
        let payment_record = PaymentRecord {
            id: payment_id,
            from: sender,
            to: split_payment.recipient_address,
            amount: amount_to_pay,
            memo: string::utf8(b"Split payment contribution"),
            payment_type: PAYMENT_SPLIT,
            related_id: option::some(split_id),
            timestamp,
            status: PAYMENT_COMPLETED,
        };
        object::delete(payment_uid);

        let sender_history = table::borrow_mut(&mut registry.payment_history, sender);
        vector::push_back(sender_history, payment_record);

        event::emit(SplitPaymentContribution {
            split_id,
            contributor: sender,
            amount: amount_to_pay,
            timestamp,
        });
    }

    // Direct Payment
    public entry fun send_payment(
        registry: &mut PlatformRegistry,
        to_username: String,
        amount: u64,
        memo: String,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(table::contains(&registry.username_registry, to_username), EUSER_NOT_FOUND);
        assert!(coin::value(&payment) >= amount, EINSUFFICIENT_BALANCE);
        assert!(amount > 0, EINVALID_AMOUNT);
        assert!(string::length(&memo) <= MAX_MEMO_LENGTH, ENAME_TOO_LONG);

        let to_address = *table::borrow(&registry.username_registry, to_username);
        let current_time = clock::timestamp_ms(clock);

        let sender_profile = table::borrow_mut(&mut registry.user_profiles, sender);
        assert!(vector::contains(&sender_profile.friends, &to_address), ENOT_FRIENDS);

        assert!(
            current_time - sender_profile.last_payment_time >= MIN_PAYMENT_INTERVAL,
            ETOO_FREQUENT_PAYMENTS
        );

        if (current_time - sender_profile.last_payment_time > DAY_IN_MS) {
            sender_profile.daily_payment_count = 0;
        };
        assert!(sender_profile.daily_payment_count < MAX_DAILY_PAYMENTS, EDAILY_LIMIT_EXCEEDED);
        sender_profile.daily_payment_count = sender_profile.daily_payment_count + 1;

        sender_profile.last_payment_time = current_time;
        sender_profile.total_payments_sent = sender_profile.total_payments_sent + 1;

        // Update recipient stats
        let recipient_profile = table::borrow_mut(&mut registry.user_profiles, to_address);
        recipient_profile.total_payments_received = recipient_profile.total_payments_received + 1;

        let payment_uid = object::new(ctx);
        let payment_id = object::uid_to_inner(&payment_uid);

        let mut payment_coin = payment;
        let transfer_coin = coin::split(&mut payment_coin, amount, ctx);
        transfer::public_transfer(transfer_coin, to_address);
        transfer::public_transfer(payment_coin, sender);

        // Record payment history
        let payment_record = PaymentRecord {
            id: payment_id,
            from: sender,
            to: to_address,
            amount,
            memo: copy memo,
            payment_type: PAYMENT_DIRECT,
            related_id: option::none(),
            timestamp: current_time,
            status: PAYMENT_COMPLETED,
        };
        object::delete(payment_uid);

        let sender_history = table::borrow_mut(&mut registry.payment_history, sender);
        vector::push_back(sender_history, payment_record);

        let recipient_history = table::borrow_mut(&mut registry.payment_history, to_address);
        vector::push_back(recipient_history, payment_record);

        event::emit(PaymentSent {
            payment_id,
            from: sender,
            to: to_address,
            amount,
            payment_type: PAYMENT_DIRECT,
            timestamp: current_time,
        });
    }

    // Batch Payment System
    public entry fun create_batch_payment(
        registry: &mut PlatformRegistry,
        to_usernames: vector<String>,
        amounts: vector<u64>,
        memos: vector<String>,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(vector::length(&to_usernames) > 0, EEMPTY_BATCH);
        assert!(vector::length(&to_usernames) <= MAX_BATCH_SIZE, EMAX_BATCH_SIZE_EXCEEDED);
        assert!(vector::length(&to_usernames) == vector::length(&amounts), EVECTOR_LENGTH_MISMATCH);
        assert!(vector::length(&to_usernames) == vector::length(&memos), EVECTOR_LENGTH_MISMATCH);

        let current_time = clock::timestamp_ms(clock);
        let sender_profile = table::borrow_mut(&mut registry.user_profiles, sender);

        // Calculate total amount and validate all payments
        let mut total_amount = 0;
        let mut i = 0;
        while (i < vector::length(&to_usernames)) {
            let username = vector::borrow(&to_usernames, i);
            let amount = *vector::borrow(&amounts, i);
            let memo = vector::borrow(&memos, i);
            
            assert!(amount > 0, EINVALID_AMOUNT);
            assert!(string::length(memo) <= MAX_MEMO_LENGTH, ENAME_TOO_LONG);
            assert!(table::contains(&registry.username_registry, *username), EUSER_NOT_FOUND);
            
            let to_address = *table::borrow(&registry.username_registry, *username);
            assert!(vector::contains(&sender_profile.friends, &to_address), ENOT_FRIENDS);
            
            total_amount = total_amount + amount;
            i = i + 1;
        };

        assert!(coin::value(&payment) >= total_amount, EINSUFFICIENT_BALANCE);

        // Check rate limiting
        assert!(
            current_time - sender_profile.last_payment_time >= MIN_PAYMENT_INTERVAL,
            ETOO_FREQUENT_PAYMENTS
        );

        if (current_time - sender_profile.last_payment_time > DAY_IN_MS) {
            sender_profile.daily_payment_count = 0;
        };
        assert!(sender_profile.daily_payment_count + vector::length(&to_usernames) <= MAX_DAILY_PAYMENTS, EDAILY_LIMIT_EXCEEDED);
        sender_profile.daily_payment_count = sender_profile.daily_payment_count + vector::length(&to_usernames);
        sender_profile.last_payment_time = current_time;
        sender_profile.total_payments_sent = sender_profile.total_payments_sent + vector::length(&to_usernames);

        // Create batch payment record
        let batch_uid = object::new(ctx);
        let batch_id = object::uid_to_inner(&batch_uid);
        
        let mut batch_items = vector::empty();
        i = 0;
        while (i < vector::length(&to_usernames)) {
            let item = BatchPaymentItem {
                to_username: *vector::borrow(&to_usernames, i),
                amount: *vector::borrow(&amounts, i),
                memo: *vector::borrow(&memos, i),
                status: PAYMENT_COMPLETED,
                completed_at: option::some(current_time),
            };
            vector::push_back(&mut batch_items, item);
            i = i + 1;
        };

        let batch_payment = BatchPayment {
            id: batch_id,
            creator: sender,
            payments: batch_items,
            created_at: current_time,
            completed_at: option::some(current_time),
            is_completed: true,
        };
        object::delete(batch_uid);

        // Process each payment
        let mut payment_coin = payment;
        i = 0;
        while (i < vector::length(&to_usernames)) {
            let username = vector::borrow(&to_usernames, i);
            let amount = *vector::borrow(&amounts, i);
            let memo = vector::borrow(&memos, i);
            let to_address = *table::borrow(&registry.username_registry, *username);
            
            // Split payment coin
            let transfer_coin = coin::split(&mut payment_coin, amount, ctx);
            transfer::public_transfer(transfer_coin, to_address);

            // Update recipient stats
            let recipient_profile = table::borrow_mut(&mut registry.user_profiles, to_address);
            recipient_profile.total_payments_received = recipient_profile.total_payments_received + 1;

            // Record payment history
            let payment_uid = object::new(ctx);
            let payment_id = object::uid_to_inner(&payment_uid);
            let payment_record = PaymentRecord {
                id: payment_id,
                from: sender,
                to: to_address,
                amount,
                memo: *memo,
                payment_type: PAYMENT_DIRECT,
                related_id: option::some(batch_id),
                timestamp: current_time,
                status: PAYMENT_COMPLETED,
            };
            object::delete(payment_uid);

            let sender_history = table::borrow_mut(&mut registry.payment_history, sender);
            vector::push_back(sender_history, payment_record);

            let recipient_history = table::borrow_mut(&mut registry.payment_history, to_address);
            vector::push_back(recipient_history, payment_record);

            event::emit(PaymentSent {
                payment_id,
                from: sender,
                to: to_address,
                amount,
                payment_type: PAYMENT_DIRECT,
                timestamp: current_time,
            });

            i = i + 1;
        };

        // Return remaining coins to sender
        transfer::public_transfer(payment_coin, sender);

        // Store the batch payment
        table::add(&mut registry.batch_payments, batch_id, batch_payment);

        event::emit(BatchPaymentCreated {
            batch_id,
            creator: sender,
            total_payments: vector::length(&to_usernames),
            total_amount,
            timestamp: current_time,
        });

        event::emit(BatchPaymentCompleted {
            batch_id,
            creator: sender,
            total_payments: vector::length(&to_usernames),
            total_amount,
            completed_at: current_time,
        });
    }

    // View Functions
    public fun get_user_profile(registry: &PlatformRegistry, user_address: address): Option<UserProfile> {
        if (table::contains(&registry.user_profiles, user_address)) {
            option::some(*table::borrow(&registry.user_profiles, user_address))
        } else {
            option::none()
        }
    }

    public fun get_user_by_username(registry: &PlatformRegistry, username: String): Option<address> {
        if (table::contains(&registry.username_registry, username)) {
            option::some(*table::borrow(&registry.username_registry, username))
        } else {
            option::none()
        }
    }

    public fun get_pending_friend_requests(registry: &PlatformRegistry, user_address: address): vector<FriendRequest> {
        if (table::contains(&registry.friend_requests, user_address)) {
            let all_requests = table::borrow(&registry.friend_requests, user_address);
            let mut pending_requests = vector::empty();
            let mut i = 0;
            while (i < vector::length(all_requests)) {
                let req = vector::borrow(all_requests, i);
                if (req.status == REQUEST_PENDING) {
                    vector::push_back(&mut pending_requests, *req);
                };
                i = i + 1;
            };
            pending_requests
        } else {
            vector::empty()
        }
    }

    public fun get_user_payment_history(
        registry: &PlatformRegistry, 
        user_address: address,
        limit: u64
    ): vector<PaymentRecord> {
        if (table::contains(&registry.payment_history, user_address)) {
            let history = table::borrow(&registry.payment_history, user_address);
            let history_length = vector::length(history);
            
            if (limit >= history_length) {
                *history
            } else {
                let mut result = vector::empty();
                let start_index = history_length - limit;
                let mut i = start_index;
                while (i < history_length) {
                    vector::push_back(&mut result, *vector::borrow(history, i));
                    i = i + 1;
                };
                result
            }
        } else {
            vector::empty()
        }
    }

    public fun get_split_payment(registry: &PlatformRegistry, split_id: ID): Option<SplitPayment> {
        if (table::contains(&registry.split_payments, split_id)) {
            option::some(*table::borrow(&registry.split_payments, split_id))
        } else {
            option::none()
        }
    }

    public fun get_platform_stats(registry: &PlatformRegistry): u64 {
        registry.total_users
    }

    public fun get_user_friends(registry: &PlatformRegistry, user_address: address): vector<address> {
        if (table::contains(&registry.user_profiles, user_address)) {
            let profile = table::borrow(&registry.user_profiles, user_address);
            profile.friends
        } else {
            vector::empty()
        }
    }

    public fun is_friends(registry: &PlatformRegistry, user1: address, user2: address): bool {
        if (table::contains(&registry.user_profiles, user1)) {
            let profile = table::borrow(&registry.user_profiles, user1);
            vector::contains(&profile.friends, &user2)
        } else {
            false
        }
    }

    // View function for batch payment
    public fun get_batch_payment(registry: &PlatformRegistry, batch_id: ID): Option<BatchPayment> {
        if (table::contains(&registry.batch_payments, batch_id)) {
            option::some(*table::borrow(&registry.batch_payments, batch_id))
        } else {
            option::none()
        }
    }
}
