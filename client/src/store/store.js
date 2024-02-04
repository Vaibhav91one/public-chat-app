import {configureStore} from '@reduxjs/toolkit';
import UserInfoSlice from './Slices/UserInfo/UserInfoSlice';

export const store = configureStore({
    reducer: {
        UserInfo: UserInfoSlice
    },
})