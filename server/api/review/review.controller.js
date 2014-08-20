'use strict';

var _ = require('lodash');
var Review = require('./review.model');
var User = require('../user/user.model');
var Response = require('../response/response.model');

// Get list of reviews
exports.index = function(req, res) {
  var author = req.user._id;
  Review.loadRecent(author, function(err, reviews) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(200, reviews);
  });
};

// Get a single review
exports.show = function(req, res) {

  Review.findById(req.params.id, function(err, review) {
    if (err) {
      return handleError(res, err);
    }
    if (!review) {
      return res.send(404);
    }
    return res.json(review);

  });
};

// Creates a new review in the DB.
exports.create = function(req, res) {
  req.body.userId = req.user._id;

  var reviewParams = req.body;
  // Grab reviewer's Name
  User.findById(req.body.author, function(err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.send(404);
    }
    // Add to model params
    reviewParams.authorName = user.name;
    // Create new model
    var review = new Review(reviewParams);
    review.save(function(err, review) {
      if (err) return err;
      if (!user) return res.send(404);
      //Push this review to response.reviews []
      Response.findById(review.responseId, function(err, response){
          response.reviews.push(review._id);
          response.save();
      });
      return res.json(201, review);
    });
  });
};

// Updates an existing review in the DB.
exports.update = function(req, res) {
  var keysToUpdate = {};

  if (req.body._id) {
    delete req.body._id;
  }

  Review.findById(req.params.id, function(err, review) {
    if (err) {
      return handleError(res, err);
    }
    if (!review) {
      console.log('DIDNT find review for param', req.params.id);
      return res.send(404);
    }

    var annotations = review.annotations.concat(req.body.annotations);

    keysToUpdate['annotations'] = annotations;
    keysToUpdate['questionId'] = req.body.questionId;
    keysToUpdate['userDeckId'] = req.body.userDeckId;
    keysToUpdate['videoId'] = req.body.videoId;
    keysToUpdate['completed'] = true;

    review.update({
      $set: keysToUpdate
    }, function() {
      return res.json(review);
    });

  });
};
// Deletes a review from the DB.
exports.destroy = function(req, res) {
  Review.findById(req.params.id, function(err, review) {
    if (err) {
      return handleError(res, err);
    }
    if (!review) {
      return res.send(404);
    }
    review.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
