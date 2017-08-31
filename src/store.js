import Vue from 'vue';
import Vuex from 'vuex';

import {now} from './time.js';

import config from '../config.json5';

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    now: now(),
    channels: {
      Categories: [],
    },
    epg: {},
    collections: JSON.parse(window.localStorage.starredChannels || '[]'),
  },
  mutations: {
    updateNow(state) {
      state.now = now();
    },
    setChannels(state, channels) {
      state.channels = channels;
    },
    setEPG(state, epg) {
      state.epg = epg;
    },
    toggleCollection(state, channel) {
      const idx = state.collections.indexOf(channel);
      if (idx !== -1) {
        state.collections.splice(idx, 1);
      } else {
        state.collections.push(channel);
      }
      window.localStorage.starredChannels = JSON.stringify(state.collections);
    },
  },
  actions: {
    fetchChannels(context) {
      window.fetch(config.channelsUrl, {
        mode: 'cors',
        credentials: 'include',
      }).then((response) => {
        if (response.status == 200) {
          return response.json();
        } else {
          console.warn('FATEL: failed to get channels!');
        }
      }).then((channels) => {
        context.commit('setChannels', channels);
      });
    },
    fetchEPG(context) {
      if (config.epgUrl && config.epgUrl.length) {
        window.fetch(config.epgUrl, {
          mode: 'cors',
          credentials: 'include',
        }).then((response) => {
          if (response.status == 200) {
            return response.json();
          } else {
            console.warn('FATEL: failed to get channels!');
          }
        }).then((epg) => {
          context.commit('setEPG', epg);
        });
      }
    },
  },
  getters: {
    defaultCategory(state) {
      if (state.channels.Categories.length > 0) {
        return state.channels.Categories[0];
      }
    },
    channelList(state, getters) {
      return (categoryName) => {
        const category = getters.getCategory(categoryName);
        return category ? category.Channels : [];
      };
    },
    getCategory(state) {
      return (categoryName) => {
        return state.channels.Categories.find(
          (c) => c['Name'] == categoryName
        );
      };
    },
    hasCategory(state, getters) {
      return (categoryName) => !!getters.getCategory(categoryName);
    },
    getChannel(state, getters) {
      return (channelName) => {
        return getters.channelMap[channelName];
      };
    },
    hasChannel(state, getters) {
      return (channelName) => !!getters.getChannel(channelName);
    },
    inCollection(state) {
      return (channel) => state.collections.includes(channel);
    },
    channelMap(state) {
      return [].concat(...state.channels.Categories.map((c) => {
        return c.Channels.map((ch) => {
          ch.Category = c.Name;
          return ch;
        });
      })).reduce((acc, cur) => {
        acc[cur.Vid] = cur;
        return acc;
      }, {});
    },
    starredChannels(state, getters) {
      return state.collections.map((col) => {
        return getters.channelMap[col];
      }).filter((channel) => !!channel);
    },
  },
});

window.setInterval(() => {
  store.commit('updateNow');
}, 1000);

store.dispatch('fetchChannels');
store.dispatch('fetchEPG');
