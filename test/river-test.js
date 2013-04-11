var mongoose  = require('mongoose')
  , elastical = require('elastical')
  , should    = require('should')
  , config    = require('./config')
  , Schema    = mongoose.Schema
  , ObjectId  = Schema.ObjectId
  , esClient  = new(require('elastical').Client)
  , mongoosastic = require('../lib/mongoosastic');  

// -- simplest indexing... index all fields
var Mentionschema = new Schema({
    user: String
  , userId: Number
  , Mention_date: Date
  , message: String
});

// Configurations for River
var options = {
  useRiver: { 
    db: "es-test",
    collection: "mentions",
    gridfs: false 
  }
}

// Configuration Default
var options = {
  useRiver: true
}

// Add Options to plugin
Mentionschema.plugin(mongoosastic, options);

var Mention = mongoose.model('Mention', Mentionschema);

// stop here
describe('River Index Method', function(){

  var fixture = {
      user: 'gabriel'
    , message: "I know capoeira!"
    , Mention_date: new Date()
  };

  before(function(done){

    // Connect Mongoose
    mongoose.connect(config.mongoUrl, function() {      

    // Create Index
    new Mention().index();

      // Add Record Direct on Mongo 
      mongoose.connection.collections.mentions.insert(fixture, function(err, doc) {
        if (err) console.log(err);
        done();
      }) 
    });

  });

  // Clear all party ;-)
  after(function(done){

    setTimeout(function(){

      mongoose.connection.collections.mentions.remove(function() {
        esClient.deleteIndex('mentions',  function() {
          esClient.deleteRiver('es-test', 'mongoose', function() {
            mongoose.disconnect();
            done();
          });      
        });
      });

    }, 2100);

  });

  it('should be able to search by river directly', function(done){
    Mention.findOne({message:'I know capoeira!'}, function(err, doc){      

        setTimeout(function(){
          Mention.search({query:'know'}, function(err, res){  
            res.hits.hits[0]._source.message.should.eql(doc.message);
            done();
          });
        }, 1100);
      
    });
  });

  // it('should be able to index to alternative index', function(done){
  //   Mention.findOne({message:'I know capoeira!'}, function(err, doc){
  //     doc.message = 'I know samba!';
  //     doc.index('public_Mentions', function(){
  //       setTimeout(function(){
  //         esClient.search({index: 'public_Mentions', query:'know'}, function(err, results, res){
  //           res.hits.hits[0]._source.message.should.eql('I know samba!');
  //           done();
  //         });
  //       }, 1100);
  //     });
  //   });
  // });
  // it('should be able to index to alternative index and type', function(done){
  //   Mention.findOne({message:'I know capoeira!'}, function(err, doc){
  //     doc.message = 'I know samba!';
  //     doc.index('public_Mentions', 'utterings', function(){
  //       setTimeout(function(){
  //         esClient.search({index: 'public_Mentions', type: 'utterings', query:'know'}, function(err, results, res){
  //           res.hits.hits[0]._source.message.should.eql('I know samba!');
  //           done();
  //         });
  //       }, 1100);
  //     });
  //   });
  // });
});
