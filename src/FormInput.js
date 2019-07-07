import React from 'react';

export class FormInput extends React.Component {

  constructor(props) {
    super(props);
    const { name, value, label, pattern, requiredMessage, patternMessage } = this.props;
    this.state = { name, value, label, pattern, requiredMessage, patternMessage };
  }

  componentWillReceiveProps(nextProps) {
    this.setState(nextProps);
  }

  render() {
    const { name, value, label, pattern, requiredMessage, patternMessage } = this.state;
    return (
      <div className="form-group row">
        <label className="control-label col-sm-2 col-form-label" htmlFor={ name }>{ label }</label>
        <div className="col-sm-10">
          <input type="text" className="form-control input-lg" name={ name } 
            value={ value } onChange={e => this.setState({value: e.target.value})}
            pattern={ pattern } autoComplete="off"/>
          <span className="errormessage patternerror">{ patternMessage }</span>
          <span className="errormessage requirederror">{ requiredMessage }</span>
        </div>
      </div>
    );
  }
}