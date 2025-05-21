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
    upgrade cap: 0x649449f1d5ceb84570c8821ee130e77906cd0cc25ccaf1e531fd40d6ef2299c0
    package id : 0x659c4ac6fb276403dcf84070bac4b95169135fed57ef4e06e0fe638daee48f3f

