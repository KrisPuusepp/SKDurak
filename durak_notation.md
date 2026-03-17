
# DURAK NOTATION

The trump suit is stored in the game record object.

Each line starts with a number that specifies the index of the player who is defending, followed by a colon and a space.

Next, for each card that is played, it is written to the line in the format "(rank)-(suit)", where rank is written exactly as you see it on the card and suit is either C, D, H or S. Each card is separated by spaces.

There are two special markers. If a player passes their turn, an X is written instead. If the defender forfeits their defense, an F is written instead.

Example of a line where the defender loses: "3: 9-D 10-D 10-C K-C X K-S F"
