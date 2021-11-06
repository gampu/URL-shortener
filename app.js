/* Requires */
var http = require( "http" );
var fs = require( "fs" );
var path = require( "path" );
var express = require( "express" );
var morgan = require( "morgan" );
var bodyParser = require( "body-parser" );
var mysql = require( "mysql" );
var dotenv = require( "dotenv" );
const app = express();

/* Setup environment variables. */
const res = dotenv.config();
if( res.error )
{
    console.log( "An error occured while processing env vars. This is not an "
                  + "error on Heroku." );
}
console.log( res.parsed );

/* Global variables */
let arr = [];
let char_pool = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D',
                  'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
                  'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd',
                  'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
                  'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z' ];
let pos = 0;

/* Swap arr[ i ] and arr[ j ] */
function swap( arr, i, j )
{
    let ch = arr[ i ];
    arr[ i ] = arr[ j ];
    arr[ j ] = ch;
}

/* Reverse arr[ i ] ... arr[ j ] */
function reverse( arr, i, j )
{
    while( i <= j )
    {
        swap( arr, i, j );
        ++i;
        --j;
    }
}

/* Return the string representation of the next permutation of arr.
   This algorithm has been figured out using the following pattern:
   0         1              2   ...
   0        0 1           0 1 2
            1 0           0 2 1
                          1 0 2
                          1 2 0
                          2 0 1
                          2 1 0 */
function next_permutation()
{
    let i = 0, j = 0;
    for( i = arr.length - 2; i >= 0; --i )
    {
        if( arr[ i ] < arr[ i + 1 ] )
        {
            break;
        }
    }
    if( i < 0 )
    {
        arr.reverse();
        arr.push( char_pool[ pos ] );
        pos += 1;
        return arr.join( "" );
    }
    for( j = arr.length - 1; j >= i + 1; --j )
    {
        if( arr[ j ] > arr[ i ] )
        {
            break;
        }
    }
    swap( arr, i, j );
    reverse( arr, i + 1, arr.length - 1 );
    return arr.join( "" );
}

/* Set */
app.set( "views", path.resolve( __dirname, "views" ) );
app.set( "view_engine", "ejs" );

/* Logger */
app.use( morgan( "combined" ) );

/* Body parser */
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );

/* Routing for "/" */
app.get( "/", function( req, res ){
    res.render( "index.ejs" );
});

/* Routing for "/<short_url>" */
app.get( "/:short_url", function( req, res )
{
    let sql = `SELECT * FROM URLTable where short_url = "${ req.params.short_url }"`;
    pool.query( sql, function( err, sql_res )
    {
        if( err )
        {
            res.status( 500 ).send();
            console.log( "Error occurred: " + err );
            return;
        }
        if( sql_res.length == 0 )
        {
            res.status( 404 ).send();
        }
        else
        {
            res.redirect( sql_res[ 0 ].long_url );
        }
    });
});

/* Routing for receiving long url */
app.post( "/post_long_url", function( req, res )
{
    let long_url = req.body.long_url;
    let sel_sql = `SELECT * FROM URLTable where long_url = "${ long_url }"`;
    pool.query( sel_sql, function( err, sel_sql_res )
    {
        if( err )
        {
            res.status( 500 ).send();
            console.log( "Error occurred: " + err );
            return;
        }
        if( sel_sql_res.length != 0 )
        {
            res.send( JSON.stringify( { short_url: sel_sql_res[ 0 ].short_url } ) );
            return;
        }
        /* Backup in case db throws errors */
        let backup_arr = arr, backup_pos = pos;

        /* Calculate next permutation */
        let next_perm = next_permutation();

        /* First insert then respond to the query */
        let ins_sql = `INSERT INTO URLTable ( long_url, short_url ) VALUES
                          ( "${ long_url }", "${ next_perm }" )`;
        pool.query( ins_sql, function( err, ins_sql_res )
        {
            if( err)
            {
                /* Restore to previous values to avoid loss of one permutation */
                arr = backup_arr;
                pos = backup_pos;
                res.status( 500 ).send();
                console.log( "Error occurred: " + err );
                return;
            }
            else
            {
                res.send( JSON.stringify( { short_url: next_perm } ) );
            }
        });
    });
});

/* Return 404 on error */
app.use( function( req, res )
{
    res.status( 404 ).render( "404.ejs" );
});

/* Setup database connection */
const pool = mysql.createPool(
{
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
});

/* Fetch lexicographically greatest short_url from db for processing
   future new requests */
let sql = "SELECT short_url from URLTable where id = ( SELECT MAX( id ) from URLTable )";
pool.query( sql, function( err, sql_res )
{
    if( err )
    {
        throw err;
    }
    if( sql_res.length != 0 )
    {
        arr = sql_res[ 0 ].short_url.split( "" );
        pos = arr.length;
    }
    console.log( sql_res );

    /* Create server */
    app.listen( process.env.PORT || 8000, function()
    {
        console.log( `Server is ready on port ${ process.env.PORT || 8000 }. Go!!!` );
    });
});
