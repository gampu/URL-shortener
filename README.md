## What is URL-shortener?
URL-shortener is a single page application(SPA) that converts long urls to short ones using unique permutations of a subset of English alphabet and single digit numbers. You can access the live deployment here: https://enigmatic-citadel-14082.herokuapp.com/

## What tech stack has been used to build this?
* Backend: Node/Express and MySQL(hosted on https://remotemysql.com)
* Frontend: HTML, CSS & JavaScript.

## How does the main functionality work?
For each new URL, the lexicographically next smallest permutation of the current in-memory maintained permutation is computed and stored in the database. Each time a previously known URL is requested, the computed value is returned.

## What are the pros of this approach?
* The largest subset that could be used to find the permutation will include 0, 1, 2, ... , 9, A, B, ... , Z, a, b, ... , z amounting to a total size of 62. Total number of permutations and hence the total number of unique URLs that could be shortened is equal to the sum of the following: 0! + 1! + 2! ... + 62! which is more than enough for our needs.
* Since the shortened-url will contain only unique characters, it would be a lot easier to read, memorize and type compared to ones containing repetitive characters.

## What are the cons of this approach?
* From around 1 billion onwards, more than 12 characters would be needed for shortened URLs. This could potentially be seen as a con because users would have to type more characters compared to popular services like https://enigmatic-citadel-14082.herokuapp.com/0213 and https://enigmatic-citadel-14082.herokuapp.com/0231.

## Do you have any future plans?
* While the current frontend does its job, it is still very naive. As I keep on learning frontend technologies, I intend to revamp the UI and add new features from time to time.
* Add tests for backend.
