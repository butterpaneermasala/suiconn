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
    package id : 0xa51f7191b61e90545b5b30f88481402dbc4ada4742dc941694f20f89d58a6511
    friendlistregistry object id: 0x557c4f0d57d188a491303586e278cf30da5046e3ab07a34fc6202df0fedbca14
    upgrade_cap: 0x5c0c5d5fce5375f3d8e220f9f01dec57fd98895896b4fbd088fc19d3da648eba


0x68de7aefdf3b399ba9e55dbd1a0337f5bb7c7f62e529848b3a6e19b44870ce93 upgrade

