var Backbone = require('backbone');
var $ = require('jquery');
var  _ = require('lodash');
var URI = require('urijs');

var ViewManager = require('./lib/view_manager.js'),
  MapView = require('./views/map/map.js'),
  MobileMenuView = require('./views/common/mobile_menu_view.js'),
  CompareView = require('./views/compare/compare.js'),
  CountriesView = require('./views/countries/countries.js'),
  CountryView = require('./views/countries/country.js');

var Router = Backbone.Router.extend({

  /*
   * Routes examples:
   * countries: countries?iso=GAB&year=2015
   */

  routes: {
    "(/)": "map",
    "map(/)": "map",
    "countries(/)(?iso=:iso&year=:year)": "countries",
    "compare(/)(?isoA=:isoA)(&isoB=:isoB)(&isoC=:isoC)": "compare"
  },

  initialize: function(options) {
    this.commonViews();
  },

  //COMMON
  commonViews: function(){
    this.views = new ViewManager();
    new MobileMenuView();
  },

  //MAP
  map: function() {
    var el = '.js--map-container';

    if (!this.views.hasView('indexMap')) {
      var view = new MapView();
      this.views.addView('indexMap', view);
    }
    this.views.showView('indexMap', el);
  },

  //COUNTRIES
  countries: function(iso, year) {
    var el = '.js--country-container';

    if (!iso) {

      if (!this.views.hasView('indexCountries')) {
        var view = new CountriesView();
        this.views.addView('indexCountries', view);
      }
      this.views.showView('indexCountries', el);
    } else {

      var configView = {
        iso: iso,
        year: year || null
      };

      if (!this.views.hasView('showCountries')) {
        var view = new CountryView(configView);
        this.views.addView('showCountries', view);
      } else {
        this.views.getView('showCountries')._updateCountryParams(iso, year)
      }
      this.views.showView('showCountries', el);
    }

    this.setListenersCountries();
  },


  setListenersCountries: function() {
    Backbone.Events.on('year:selected', this.updateParams, this);
  },

  //Update params
  _updateCountryParams: function(iso, year) {
    this.year = year;
    this.iso = iso;
    this.updateUrl();
  },

  //Update URL
  updateUrl: function() {
    //TOOD - review this method
    var stringYear = '',
      iso = window.location.hash.split('&')[0].slice(1);

    if (this.year) {
      stringYear = '&' + this.year;
    }

    this.navigate(iso + stringYear);
  },

  //COMPARE
  compare: function(isoA, isoB, isoC) {
    var params =  URI("?" + window.location.hash.split("#")[1]).query(true);
    var data = {};

    if (params.countries) {
      var c = params.countries;
      data = c.split(',');
    }

    var el = '.js--compare-container';

    if (!this.views.hasView('compare')) {
      this.views.addView('compare', new CompareView(data));
    } else {
      this.views.getView('compare').update(data);
    }

    this.views.showView('compare', el);
  },

  //Update URL
  _updateUrl: function(p) {
    var isCollection = false,
      url = 'countries=';

    if (typeof p.toJSON === 'function') {
      isCollection = true;
      params= p.toJSON();

      params = _.omit(params, function(p) {
        return !p.iso || p.iso == 'no_data' || !p.year || p.year == 'no-data';
      });

      totalData = _.size(params);

    } else {
      params = [];
      _.each(p, function(slide) {

        if(slide.status.get('iso') && slide.status.get('iso') !== 'no_data'
          && slide.status.get('year') && slide.status.get('year') !== 'no-data') {
          params.push(slide.status);
        }

      });

      totalData = params.length;
    }

    if (isCollection) {

      if(totalData == 0) {
        url = 'default';
      }

      _.each(params, function(country, i) {

        url +=  country.iso + ':' + country.year;

        if(Number(i) + 1 < totalData) {
          url += ',';
        }

      }.bind(this));

    } else {

      if(totalData == 0) {
        url = 'default';
      } else {
        url = 'countries=';
      }

      _.each(params, function(slide, i) {
        url += slide.get('iso') + ':' + slide.get('year');

        if(i + 1 < totalData) {
          url += ',';
        }
      });

    }
    this.navigate(url);
  }


});

module.exports = Router;
