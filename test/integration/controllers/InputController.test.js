var request = require('supertest');
var expect = require('expect');
var _ = require('lodash');
var constants = require('../../../constants');
var createLocalHostAccount = require('../../../functions').createLocalHostAccount;

describe('InputController', function () {

  describe('POST /jobs/:parentid/inputs/uploadfile', function () {
    beforeEach(function (done) {
      const cb = () => Job.create({
        id: 1,
        name: 'first job',
        submitter: 'symfonie.com/123'
      }).exec((err, res) => {
        if (err) console.error(err);
        createLocalHostAccount(done);
      });

      sails.once('hook:orm:reloaded', cb);
      sails.emit('hook:orm:reload');
    });

    it('should handle file upload and input creation', function (done) {
      request(sails.hooks.http.app)
        .post('/jobs/1/inputs/uploadfile')
        .set('Authorization', 'Bearer ' + constants.ROOT_USER_API_KEY)
        .field('sourceLanguage', 'en')
        .field('encoding', 'utf8')
        .attach('input', 'test/fixtures/testInputFile.txt')
        .expect(200)
        .then((response) => {
          expect(_.omit(response.body, ['updatedAt', 'createdAt'])).toEqual({
            id: 1,
            jobId: 1,
            sourceLanguage: 'en',
            encoding: 'utf8',
            fileDescriptor: response.body.fileDescriptor,
            fileOriginalName: 'testInputFile.txt'
          });

          Job.findOne(1).populate('inputs').exec(function (err, res) {
            expect(err).toBe(null)
            expect(_.omit(res.toJSON(), ['createdAt', 'updatedAt'])).toEqual({
              id: 1,
              name: 'first job',
              submitter: 'symfonie.com/123',
              inputs: [response.body]
            });
            done()
          });
        }).catch(err => {
          expect(err).not.toBeDefined()
          done()
        });
    });

  });

});