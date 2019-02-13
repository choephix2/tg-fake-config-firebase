const functions = require('firebase-functions');
const admin = require( 'firebase-admin' )
const express = require( 'express' )
const pug = require('pug')

admin.initializeApp( functions.config().firebase )

const db = admin.firestore()
const app = express()

console.log("\n\nINITITI\n\n")

app.get( '/', ( req, res ) => res.redirect('/api?api_key=generic') )

app.get( '/api', ( req, res ) => {
  let api_key = req.query['api_key']
  if (!api_key) api_key = "generic"
  let ref = db.collection( 'configurations_per_api_key' ).doc( api_key )
  ref.get().then( doc => {
    let json = !doc.exists ? "{}" : doc.data().json
    return res.send( json ) 
  } ).catch( e => res.send( e ) )
} )

app.put( '/api/telegramUsers/:user_id', ( req, res ) => {
  let user_id = req.params["user_id"]
  let session_key = JSON.parse(req.body)["session_key"]
  console.log(`New session key received for user ${user_id}:\n${session_key}`)
} )

app.put( '/api/telegramChannels/:api_channel_id', ( req, res ) => {
  let api_channel_id = req.params["api_channel_id"]
  let data = req.body
  console.log(`New data received for channel ${api_channel_id}:\n${data}`)
} )

app.get( '/api/telegramUsers/:user_id/requestVerificationCode', ( req, res ) => {
  console.log(`User ${req.params['user_id']} submitted a request for verification code.`)
  return res.send( "{}" )
} )

app.get( '/api/telegramUsers/:user_id/getVerificationCode', ( req, res ) => {
  console.log(`User ${req.params['user_id']} checked for verification code.`)
  return res.send( "{}" )
} )

///

app.get( '/edit/:api_key', ( req, res ) => {
  let api_key = req.params['api_key']
  let ref = db.collection( 'configurations_per_api_key' ).doc( api_key )
  ref.get().then( doc => {
    let json = !doc.exists ? "{}" : doc.data().json
    let data = { json: json, doc : api_key }
    let html = pug.renderFile( 'edit.pug', data )
    return res.send( html ) 
  } ).catch( e => res.send( e ) )
} )

app.post( '/set/:api_key', ( req, res ) => {
  let api_key = req.params['api_key']
  let ref = db.collection( 'configurations_per_api_key' ).doc( api_key )
  let json = req.body
  ref.set( { json: json } )
     .then( o => res.send( 'ok' ) )
     .catch( e => res.send( e ) )
} )

///

exports.app = functions.https.onRequest( app )
