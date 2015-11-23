beforeEach(function () {
  jasmine.addMatchers({
    toBeInstanceOf: function () {
      return {
        compare: function (actual, expected) {
          var instance = actual;

          return {
            pass: instance instanceof expected
          }
        }
      };
    }
  });
});
