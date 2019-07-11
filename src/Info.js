import * as React from 'react';
import { showLocalIP } from './network';

export default class Info extends React.Component {
  state = {
    serverVersion: {}
  }
  
  componentDidMount() {
    showLocalIP();
    fetch('/version')
      .then(response => response.json())
      .then(response => { 
        this.setState({ serverVersion: response })
      });
  }

  render () {
    const { serverVersion } = this.state;
    return (
    <div>
      This client's local address: <span id="localIP">unknown</span><br />
      <br />
      <strong>{process.env.REACT_APP_NAME}</strong><br />
      Version: {process.env.REACT_APP_VERSION}<br />
      Git head: {process.env.REACT_APP_GITHEAD}<br />
      <br />
      <strong>{serverVersion.name}</strong><br />
      Version: {serverVersion.version}<br />
      Git head: {serverVersion.githead}<br />
    </div>);
  }
}
