import React from 'react';

export class FormSelect extends React.Component {

  constructor(props) {
    super(props);
    const { name, label, options, value, onChange } = this.props;
    this.state = { name, label, options, value, onChange };
  }

  componentWillReceiveProps(nextProps) {
    this.setState(nextProps);
  }

  onValueChange(e) {
    const value = e.target.value;
    this.setState({ value },
      () => { this.state.onChange && this.state.onChange(value) });
  }

  render() {
    const { name, label, options, value } = this.state;
    return (
      <div className="form-group row">
        <label className="control-label col-sm-3" htmlFor={ name }>{ label }</label>
        <div className="col-sm-9">
          <select className="form-control input-lg" name={ name } value={ value } 
            onChange={this.onValueChange.bind(this)}>
            { options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}
