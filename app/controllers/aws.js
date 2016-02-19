//
// AWS Controller
//

'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    psjon = require('./../../package.json'),
    auth = require('./../auth/index'),
    path = require('path'),
    settings = require('./../config').aws.credentials,
    aws = require('aws-sdk');

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    //
    // Routes
    //
    app.get('/sign_s3', function(req, res){
        
        aws.config = {
            accessKeyId: settings.AWS_ACCESS_KEY, 
            secretAccessKey: settings.AWS_SECRET_KEY
        };

        var s3 = new aws.S3();
        var s3_params = {
            Bucket: settings.AUDIO_BUCKET,
            Key: req.query.file_name,
            ContentType: req.query.file_type,
            Body: ''
        };
        s3.getSignedUrl('putObject', s3_params, function(err, url){
            if(err){
                console.log(err);
            }
            else{
                var return_data = {
                    post_url: url,
                    key: req.query.file_name,
                    url: 'https://s3.amazonaws.com/'+settings.AUDIO_BUCKET+'/'+req.query.file_name
                };
                res.write(JSON.stringify(return_data));
                res.end();
            }
        });
    });
};