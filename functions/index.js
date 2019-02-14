const functions = require('firebase-functions');
const admin = require( 'firebase-admin' )
const express = require( 'express' )
const pug = require('pug')
const deepmerge = require('deepmerge');

admin.initializeApp( functions.config().firebase )

const db = admin.firestore()
const app = express()

const collection_configurations_per_api_key = db.collection( 'configurations_per_api_key' )

// app.get( '/', ( req, res ) => res.redirect('/api?api_key=default') )
app.get( '/', async function( req, res ) {
  
  try
  {
    let snapshot = await collection_configurations_per_api_key.get()
    let data = { keys : [] }
    snapshot.forEach(doc => data.keys.push(doc.id) )
    let html = pug.renderFile( 'pug/index.pug', data )
    return res.send( html ) 
  }
  catch( e ) { return res.send( e.name + ': ' + e.message ) }
} )


app.get( '/api', async function( req, res ) {
  
  try
  {
    res.setHeader( 'Content-Type', 'application/json' )
    let api_key = req.query['api_key'] || "default"
    
    let datas = []
    let next_doc_name = api_key
    
    while ( next_doc_name )
    {
      let ref = collection_configurations_per_api_key.doc( next_doc_name )
      let doc = await ref.get()
      let data = doc.data() ? JSON.parse( doc.data().json ) : {}
      console.log( `got data for ${next_doc_name}`)
      datas.unshift( data )
      next_doc_name = data['extends']
    }
    
    let result = deepmerge.all( datas, { arrayMerge: (a,b)=>b } )
    delete result.extends
    return res.send( result )
  }
  catch( e ) { return res.send( e.name + ': ' + e.message ) }
} )

app.put( '/api/telegramUsers/:user_id', ( req, res ) => {
  res.setHeader( 'Content-Type', 'application/json' );
  let user_id = req.params["user_id"]
  console.log(req.body)
  let session_key = req.body["session_key"]
  console.log(`New session key received for user ${user_id}:\n${session_key}`)
  
  let ref = db.collection( 'session_keys' ).add( { user_id : user_id, value : session_key } )
     .then( o => res.send( 'ok' ) )
     .catch( e => res.send( e ) )
} )

app.put( '/api/telegramChannels/:api_channel_id', ( req, res ) => {
  res.setHeader( 'Content-Type', 'application/json' );
  let api_channel_id = req.params["api_channel_id"]
  let data = req.body
  console.log(`New data received for channel ${api_channel_id}:\n${data}`)
  
  let ref = db.collection( 'channel_updates' ).add( req.body )
     .then( o => res.send( 'ok' ) )
     .catch( e => res.send( e ) )
} )

app.get( '/api/telegramUsers/:user_id/requestVerificationCode', ( req, res ) => {
  res.setHeader( 'Content-Type', 'application/json' );
  console.log(`User ${req.params['user_id']} submitted a request for verification code.`)
  return res.send( "{}" )
} )

app.get( '/api/telegramUsers/:user_id/getVerificationCode', ( req, res ) => {
  res.setHeader( 'Content-Type', 'application/json' );
  console.log(`User ${req.params['user_id']} checked for verification code.`)
  return res.send( "{}" )
} )

app.get( '/api/**', ( req, res ) => {
  res.setHeader( 'Content-Type', 'application/json' );
  return res.send( "{}" )
} )


///

function echo_jsonedit( req, res ) 
{
  let api_key = req.params['api_key']
  let ref = collection_configurations_per_api_key.doc( api_key )
  ref.get().then( doc => {
    let json = !doc.exists ? "{}" : doc.data().json
    let data = { json: json, doc : api_key }
    let html = pug.renderFile( 'pug/jsonedit.pug', data )
    return res.send( html ) 
  } ).catch( e => res.send( e ) )
}
app.get( '/jsonedit/:api_key', echo_jsonedit )
app.get( '/jsonedit', (req,res) => { req.params = req.query; return echo_jsonedit(req,res); } )

app.post( '/set/:api_key', ( req, res ) => {
  let api_key = req.params['api_key']
  let ref = collection_configurations_per_api_key.doc( api_key )
  let json = req.body
  ref.set( { json: json } )
     .then( o => res.send( 'ok' ) )
     .catch( e => res.send( e ) )
} )

///

exports.app = functions.https.onRequest( app )
