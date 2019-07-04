import * as React from 'react';
import { showLocalIP } from './network';

export default class Info extends React.Component {
  state = {
  }
  
  componentDidMount() {
    showLocalIP();
  }

  render () {
    return (
    <div>
      This client's local address: <span id="localIP">unknown</span>
    </div>);
  }
}
