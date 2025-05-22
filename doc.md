## start
ttwo directories
-suisplit ie. frontend
-sui ie. contract

for now there is the frontend - react + ts 
    complited- wallet coonect using suiet/wallet-kit

7:44
    setting up friend list on backend/sui
    created friend_list.move
    testing:
        pblished
        call create friend_list

replace the package id and friend_list object id in friendList.tsx

testing:
    friend add successfully but not visible??
    fixed.

updating the contact:
    auto call create friend list if the user has no friend list, other wise all good
    let a user create only one friend list
    to update we need package id and upgrade cap
    upgrade cap: 
    package id : 


switched to devnet:
    fixing registry related errors
    package id: 
    registry object id: 
    import { useWallet, useSuiClient } from '@suiet/wallet-kit';
    upgrade cap : 
new deploy:
    package id: 0x689b3ab5e808c8d0b6b20f23211a45fb02a5e42b6e80e2b0304039b22330c279
    FriendListRegistry : 0x749a85ea65afc7e1ec0a43f9cccc226f969db27cf7378edaf575117733eb4c6e
    upgrade cap: 0xae2c4d4534c5f022d16664428e742b16cc282db3c11c05548f1958b878b2d7cc


5:32 22: the add friend working..


new:
    sui client publish --gas-budget 100000000
    package id : 0x2330e27d8276d01ed5c111e6047383b1883570907658b5a099c2366b567f38ca
    friendlistregistry object id: 0x4c8501ae4533f3e72fa413586b97933c1b98ad3971f396f966fa5f98c3b871be
    upgrade_cap: 0xfb0047c6e3b72d278b88e8b8dc980f63092af64709f436b4a7bcea5b5abb360a


