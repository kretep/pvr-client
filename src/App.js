import React from 'react';
import SearchBox from './SearchBox.js';
import VisitDetails from './VisitDetails';
import Visits from './Visits';
import Info from './Info';
import NoMatch from './NoMatch';
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

class App extends React.Component {

  render() {
    return (
      <Router>
        <div className="App">
          <main>
            <Switch>
              <Route exact path="/" component={SearchBox} />
              <Route exact path="/visit/:id" component={VisitDetails} />
              <Route exact path="/visit" component={VisitDetails} />
              <Route exact path="/visits" component={Visits} />
              <Route exact path="/info" component={Info} />
              <Route component={NoMatch} />
            </Switch>
          </main>
        </div>
      </Router>
    );
  }
}

export default App;
