import { compose, applyMiddleware, createStore } from 'redux';

import { persistStore, persistReducer } from "redux-persist";
import { AsyncStorage } from 'react-native';
import { find, without } from 'lodash';

const reducer = (state, action) => {
  const { type } = action;

  if (type === "REHYDRATE") {
    if (persistedStateIsInvalid(action.payload)) {
      return getInitialState();
    } else {
      return action.payload;
    }
  } else if (type === 'SET_REMINDER') {
    return addReminder(state, action.data);
  } else if (type === 'REMOVE_REMINDER') {
    return removeReminder(state, action.data.notificationId);
  } else {
    return state;
  }
};

const getInitialState = () => {
  return {
    reminders: [],
  };
};

function addReminder(state, { time, notificationId }) {
  return {
    ...state,
    reminders: [...state.reminders, { time, notificationId }],
  };
}

function removeReminder(state, notificationId) {
  let reminder = find(
    state.reminders,
    reminder => reminder.notificationId === notificationId
  );

  return {
    ...state,
    reminders: without(state.reminders, reminder),
  };
}

function persistedStateIsInvalid(state) {
  return Object.keys(state).length === 0;
}

const r = persistReducer(
  { key: "root", storage: AsyncStorage },
  reducer,
);

const Store = createStore(
  r,
  getInitialState(),
  compose(applyMiddleware())
);

Store.rehydrateAsync = () => {
  return new Promise(resolve => {
    persistStore(Store, () => {
      resolve();
    });
  });
};

export default Store;
