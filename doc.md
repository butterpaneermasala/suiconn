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


