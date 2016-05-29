import injectTapEventPlugin from 'react-tap-event-plugin';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory, IndexRoute } from 'react-router'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';

import {cyan500} from 'material-ui/styles/colors';


import StateMachine from './controllers/StateMachine'

import '../node_modules/flexboxgrid/dist/flexboxgrid.min.css'

const darkMuiTheme = getMuiTheme(darkBaseTheme);
const lightMuiTheme = getMuiTheme(lightBaseTheme);
const muiTheme = getMuiTheme({
    palette: {
        textColor: cyan500
    },
    appBar: {
        height: 50
    }
});

injectTapEventPlugin();

ReactDOM.render(
    <MuiThemeProvider muiTheme={darkMuiTheme}>
        <StateMachine />
    </MuiThemeProvider>,
    document.getElementById('app')
);