'use strict';

var _ = require('lodash');
var Review = require('./review.model');
var User = require('../user/user.model');

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
  console.log("Grabbing single review");
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

  User.findById(req.body.author, function(err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.send(404);
    }

    reviewParams.authorName = user.name;
    var review = new Review(reviewParams);
    review.save(function(err, review) {
      if (err) {
        return handleError(res, err);
      }
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
