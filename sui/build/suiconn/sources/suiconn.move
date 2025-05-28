module suiconn::suiconn {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::bag::{Self, Bag};
    use sui::event;
    use sui::balance;
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
    const EGROUP_NOT_FOUND: u64 = 16;
    const ENOT_GROUP_ADMIN: u64 = 17;
    const EMEMBER_NOT_FOUND: u64 = 18;
    const EMAX_GROUP_MEMBERS_EXCEEDED: u64 = 19;
    const ESPLIT_PAYMENT_NOT_FOUND: u64 = 20;
    const EALREADY_PAID: u64 = 21;
    const EINVALID_SPLIT_AMOUNT: u64 = 22;
    const EGROUP_NAME_TOO_LONG: u64 = 24;
    const ENOT_FRIENDS: u64 = 25;
    const ESELF_FRIEND_REQUEST: u64 = 26;
    const EGROUP_ALREADY_EXISTS: u64 = 27;
    const EINACTIVE_USER: u64 = 28;
    const EZERO_PARTICIPANTS: u64 = 29;
    const EOVERPAYMENT: u64 = 30;
    const ETOO_FREQUENT_PAYMENTS: u64 = 31;
    const EDAILY_LIMIT_EXCEEDED: u64 = 32;
    const EINVALID_USERNAME_CHARS: u64 = 33;
    const EPLATFORM_PAUSED: u64 = 34;

    // Constants
    const MAX_FRIENDS: u64 = 500;
    const MAX_USERNAME_LENGTH: u64 = 30;
    const MAX_MEMO_LENGTH: u64 = 200;
    const MAX_BATCH_SIZE: u64 = 50;
    const MAX_GROUP_MEMBERS: u64 = 100;
    const MAX_GROUP_NAME_LENGTH: u64 = 50;
    const MAX_DAILY_PAYMENTS: u64 = 100;
    const MIN_PAYMENT_INTERVAL: u64 = 1000; // 1 second
    const DAY_IN_MS: u64 = 86400000; // 24 hours

    // Request Status
    const REQUEST_PENDING: u8 = 0;
    const REQUEST_ACCEPTED: u8 = 1;
    const REQUEST_REJECTED: u8 = 2;

    // Group Member Role
    const ROLE_MEMBER: u8 = 0;
    const ROLE_ADMIN: u8 = 1;

    // Payment Types
    const PAYMENT_DIRECT: u8 = 0;
    const PAYMENT_SPLIT: u8 = 1;
    const PAYMENT_GROUP: u8 = 2;

    // Payment Status
    const PAYMENT_PENDING: u8 = 0;
    const PAYMENT_COMPLETED: u8 = 1;
    const PAYMENT_FAILED: u8 = 2;

    // Admin capability for emergency situations
    public struct AdminCap has key, store {
        id: UID,
    }

    // Main Platform Registry (shared object)
    public struct PlatformRegistry has key {
        id: UID,
        user_profiles: Table<address, UserProfile>,
        username_registry: Table<String, address>,
        friend_requests: Table<address, vector<FriendRequest>>,
        groups: Table<ID, Group>,
        split_payments: Table<ID, SplitPayment>,
        payment_history: Table<address, vector<PaymentRecord>>,
        total_users: u64,
        total_groups: u64,
        is_paused: bool,
    }

    // Enhanced User Profile with rate limiting
    public struct UserProfile has store, copy, drop {
        username: String,
        address: address,
        friends: vector<address>,
        groups: vector<ID>,
        created_at: u64,
        is_active: bool,
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

    // Enhanced Group with better management
    public struct Group has store, copy, drop {
        id: ID,
        name: String,
        description: Option<String>,
        admin: address,
        members: vector<GroupMember>,
        created_at: u64,
        total_spent: u64,
        is_active: bool,
        member_count: u64,
    }

    // Group Member
    public struct GroupMember has store, copy, drop {
        address: address,
        role: u8,
        joined_at: u64,
        total_contributed: u64,
    }

    // Enhanced Split Payment
    public struct SplitPayment has store, copy, drop {
        id: ID,
        creator: address,
        group_id: Option<ID>,
        title: String,
        total_amount: u64,
        participants: vector<SplitParticipant>,
        created_at: u64,
        completed_at: Option<u64>,
        is_completed: bool,
        payment_deadline: Option<u64>,
    }

    // Split Participant
    public struct SplitParticipant has store, copy, drop {
        address: address,
        amount_owed: u64,
        amount_paid: u64,
        has_paid: bool,
        paid_at: Option<u64>,
    }

    // Enhanced Payment Record
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

    public struct GroupCreated has copy, drop {
        group_id: ID,
        name: String,
        admin: address,
        timestamp: u64,
    }

    public struct MemberAddedToGroup has copy, drop {
        group_id: ID,
        member: address,
        added_by: address,
        timestamp: u64,
    }

    public struct SplitPaymentCreated has copy, drop {
        split_id: ID,
        creator: address,
        total_amount: u64,
        participants_count: u64,
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

    public struct PlatformPaused has copy, drop {
        timestamp: u64,
        admin: address,
    }

    public struct UserDeactivated has copy, drop {
        user_address: address,
        admin: address,
        timestamp: u64,
    }

    // Initialize the platform
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        
        let registry = PlatformRegistry {
            id: object::new(ctx),
            user_profiles: table::new(ctx),
            username_registry: table::new(ctx),
            friend_requests: table::new(ctx),
            groups: table::new(ctx),
            split_payments: table::new(ctx),
            payment_history: table::new(ctx),
            total_users: 0,
            total_groups: 0,
            is_paused: false,
        };
        
        transfer::transfer(admin_cap, tx_context::sender(ctx));
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

    // Enhanced User Registration with validation
    public entry fun register_user(
        registry: &mut PlatformRegistry,
        username: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
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
            groups: vector::empty(),
            created_at: timestamp,
            is_active: true,
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

    // Enhanced Friend Request System with rate limiting
    public entry fun send_friend_request(
        registry: &mut PlatformRegistry,
        to_username: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(table::contains(&registry.username_registry, to_username), EUSER_NOT_FOUND);

        let to_address = *table::borrow(&registry.username_registry, to_username);
        assert!(sender != to_address, ESELF_FRIEND_REQUEST);

        let sender_profile = table::borrow_mut(&mut registry.user_profiles, sender);
        assert!(sender_profile.is_active, EINACTIVE_USER);
        assert!(!vector::contains(&sender_profile.friends, &to_address), EFRIEND_ALREADY_ADDED);
        assert!(vector::length(&sender_profile.friends) < MAX_FRIENDS, EMAX_FRIENDS_EXCEEDED);

        let current_time = clock::timestamp_ms(clock);
        // Rate limiting: prevent spam friend requests
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
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
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

    // Enhanced Group Management
    public entry fun create_group(
        registry: &mut PlatformRegistry,
        name: String,
        description: Option<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(string::length(&name) > 0, EGROUP_NAME_TOO_LONG);
        assert!(string::length(&name) <= MAX_GROUP_NAME_LENGTH, EGROUP_NAME_TOO_LONG);

        let sender_profile = table::borrow(&registry.user_profiles, sender);
        assert!(sender_profile.is_active, EINACTIVE_USER);

        let timestamp = clock::timestamp_ms(clock);
        let group_uid = object::new(ctx);
        let group_id = object::uid_to_inner(&group_uid);

        let admin_member = GroupMember {
            address: sender,
            role: ROLE_ADMIN,
            joined_at: timestamp,
            total_contributed: 0,
        };

        let mut members = vector::empty();
        vector::push_back(&mut members, admin_member);

        let group = Group {
            id: group_id,
            name: copy name,
            description,
            admin: sender,
            members,
            created_at: timestamp,
            total_spent: 0,
            is_active: true,
            member_count: 1,
        };

        table::add(&mut registry.groups, group_id, group);
        object::delete(group_uid);

        let user_profile = table::borrow_mut(&mut registry.user_profiles, sender);
        vector::push_back(&mut user_profile.groups, group_id);

        registry.total_groups = registry.total_groups + 1;

        event::emit(GroupCreated {
            group_id,
            name,
            admin: sender,
            timestamp,
        });
    }

    public entry fun add_member_to_group(
        registry: &mut PlatformRegistry,
        group_id: ID,
        member_username: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.groups, group_id), EGROUP_NOT_FOUND);
        assert!(table::contains(&registry.username_registry, member_username), EUSER_NOT_FOUND);

        let member_address = *table::borrow(&registry.username_registry, member_username);
        let group = table::borrow_mut(&mut registry.groups, group_id);
        assert!(group.admin == sender, ENOT_GROUP_ADMIN);
        assert!(group.is_active, EINACTIVE_USER);
        assert!(group.member_count < MAX_GROUP_MEMBERS, EMAX_GROUP_MEMBERS_EXCEEDED);

        // Check if member already exists
        let mut i = 0;
        while (i < vector::length(&group.members)) {
            let member = vector::borrow(&group.members, i);
            assert!(member.address != member_address, EFRIEND_ALREADY_ADDED);
            i = i + 1;
        };

        let timestamp = clock::timestamp_ms(clock);
        let new_member = GroupMember {
            address: member_address,
            role: ROLE_MEMBER,
            joined_at: timestamp,
            total_contributed: 0,
        };

        vector::push_back(&mut group.members, new_member);
        group.member_count = group.member_count + 1;

        let user_profile = table::borrow_mut(&mut registry.user_profiles, member_address);
        vector::push_back(&mut user_profile.groups, group_id);

        event::emit(MemberAddedToGroup {
            group_id,
            member: member_address,
            added_by: sender,
            timestamp,
        });
    }

    // Transfer group admin
    public entry fun transfer_group_admin(
        registry: &mut PlatformRegistry,
        group_id: ID,
        new_admin_username: String,
        ctx: &mut TxContext
    ) {
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.groups, group_id), EGROUP_NOT_FOUND);
        assert!(table::contains(&registry.username_registry, new_admin_username), EUSER_NOT_FOUND);
        
        let group = table::borrow_mut(&mut registry.groups, group_id);
        assert!(group.admin == sender, ENOT_GROUP_ADMIN);
        
        let new_admin_address = *table::borrow(&registry.username_registry, new_admin_username);
        
        // Verify new admin is a group member
        let mut is_member = false;
        let mut member_index = 0;
        let mut i = 0;
        while (i < vector::length(&group.members)) {
            let member = vector::borrow(&group.members, i);
            if (member.address == new_admin_address) {
                is_member = true;
                member_index = i;
                break
            };
            i = i + 1;
        };
        assert!(is_member, EMEMBER_NOT_FOUND);
        
        // Update roles
        group.admin = new_admin_address;
        let new_admin_member = vector::borrow_mut(&mut group.members, member_index);
        new_admin_member.role = ROLE_ADMIN;
        
        // Demote old admin to member
        i = 0;
        while (i < vector::length(&group.members)) {
            let member = vector::borrow_mut(&mut group.members, i);
            if (member.address == sender) {
                member.role = ROLE_MEMBER;
                break
            };
            i = i + 1;
        };
    }

    // Enhanced Split Payment System
    public entry fun create_split_payment(
        registry: &mut PlatformRegistry,
        title: String,
        total_amount: u64,
        participants: vector<String>,
        group_id: Option<ID>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
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
            group_id,
            title: copy title,
            total_amount,
            participants: split_participants,
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
            timestamp,
        });
    }

    // Custom split payment with different amounts
    public entry fun create_custom_split_payment(
        registry: &mut PlatformRegistry,
        title: String,
        participants: vector<String>,
        amounts: vector<u64>,
        group_id: Option<ID>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(vector::length(&participants) == vector::length(&amounts), EVECTOR_LENGTH_MISMATCH);
        assert!(vector::length(&participants) > 0, EZERO_PARTICIPANTS);
        
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
            group_id,
            title: copy title,
            total_amount,
            participants: split_participants,
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
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
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

        assert!(option::is_some(&participant_index), EMEMBER_NOT_FOUND);
        let index = option::extract(&mut participant_index);
        let participant = vector::borrow_mut(&mut split_payment.participants, index);

        assert!(coin::value(&payment) >= participant.amount_owed, EINSUFFICIENT_BALANCE);

        let amount_to_pay = participant.amount_owed;
        let mut payment_coin = payment;
        let split_coin = coin::split(&mut payment_coin, amount_to_pay, ctx);

        transfer::public_transfer(split_coin, split_payment.creator);
        transfer::public_transfer(payment_coin, sender);

        let timestamp = clock::timestamp_ms(clock);
        participant.amount_paid = amount_to_pay;
        participant.has_paid = true;
        participant.paid_at = option::some(timestamp);

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
        };

        // Record payment history
        let payment_uid = object::new(ctx);
        let payment_id = object::uid_to_inner(&payment_uid);
        let payment_record = PaymentRecord {
            id: payment_id,
            from: sender,
            to: split_payment.creator,
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

    // Enhanced Direct Payment with friend verification and rate limiting
    public entry fun send_payment(
        registry: &mut PlatformRegistry,
        to_username: String,
        amount: u64,
        memo: String,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!registry.is_paused, EPLATFORM_PAUSED);
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.user_profiles, sender), EUSER_NOT_FOUND);
        assert!(table::contains(&registry.username_registry, to_username), EUSER_NOT_FOUND);
        assert!(coin::value(&payment) >= amount, EINSUFFICIENT_BALANCE);
        assert!(amount > 0, EINVALID_AMOUNT);
        assert!(string::length(&memo) <= MAX_MEMO_LENGTH, ENAME_TOO_LONG);

        let to_address = *table::borrow(&registry.username_registry, to_username);
        let current_time = clock::timestamp_ms(clock);

        // Friend verification
        let sender_profile = table::borrow_mut(&mut registry.user_profiles, sender);
        assert!(sender_profile.is_active, EINACTIVE_USER);
        assert!(vector::contains(&sender_profile.friends, &to_address), ENOT_FRIENDS);

        // Rate limiting
        assert!(
            current_time - sender_profile.last_payment_time >= MIN_PAYMENT_INTERVAL,
            ETOO_FREQUENT_PAYMENTS
        );

        // Daily limit check
        if (current_time - sender_profile.last_payment_time > DAY_IN_MS) {
            sender_profile.daily_payment_count = 0;
        };
        assert!(sender_profile.daily_payment_count < MAX_DAILY_PAYMENTS, EDAILY_LIMIT_EXCEEDED);

        sender_profile.last_payment_time = current_time;
        sender_profile.daily_payment_count = sender_profile.daily_payment_count + 1;
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

    // Admin functions
    public entry fun pause_platform(
        _: &AdminCap,
        registry: &mut PlatformRegistry,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        registry.is_paused = true;
        let timestamp = clock::timestamp_ms(clock);
        
        event::emit(PlatformPaused {
            timestamp,
            admin: tx_context::sender(ctx),
        });
    }

    public entry fun unpause_platform(
        _: &AdminCap,
        registry: &mut PlatformRegistry
    ) {
        registry.is_paused = false;
    }

    public entry fun deactivate_user(
        _: &AdminCap,
        registry: &mut PlatformRegistry,
        user_address: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        if (table::contains(&registry.user_profiles, user_address)) {
            let profile = table::borrow_mut(&mut registry.user_profiles, user_address);
            profile.is_active = false;
            
            let timestamp = clock::timestamp_ms(clock);
            event::emit(UserDeactivated {
                user_address,
                admin: tx_context::sender(ctx),
                timestamp,
            });
        };
    }

    // Enhanced View Functions
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

    public fun get_user_groups(registry: &PlatformRegistry, user_address: address): vector<Group> {
        if (table::contains(&registry.user_profiles, user_address)) {
            let profile = table::borrow(&registry.user_profiles, user_address);
            let mut user_groups = vector::empty();
            let mut i = 0;
            while (i < vector::length(&profile.groups)) {
                let group_id = *vector::borrow(&profile.groups, i);
                if (table::contains(&registry.groups, group_id)) {
                    let group = *table::borrow(&registry.groups, group_id);
                    vector::push_back(&mut user_groups, group);
                };
                i = i + 1;
            };
            user_groups
        } else {
            vector::empty()
        }
    }

    public fun get_group(registry: &PlatformRegistry, group_id: ID): Option<Group> {
        if (table::contains(&registry.groups, group_id)) {
            option::some(*table::borrow(&registry.groups, group_id))
        } else {
            option::none()
        }
    }

    public fun get_split_payment(registry: &PlatformRegistry, split_id: ID): Option<SplitPayment> {
        if (table::contains(&registry.split_payments, split_id)) {
            option::some(*table::borrow(&registry.split_payments, split_id))
        } else {
            option::none()
        }
    }

    public fun get_platform_stats(registry: &PlatformRegistry): (u64, u64, bool) {
        (registry.total_users, registry.total_groups, registry.is_paused)
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
}
