import React from 'react';

export class FormSelect extends React.Component {

  handleChange(event) {
  }

  render() {
    const props = this.props;
    return (
      <div className="form-group row">
        <label className="control-label col-sm-3" htmlFor={ props.name }>{ props.label }</label>
        <div className="col-sm-9">
          <select className="form-control input-lg" name={ props.name } defaultValue={ props.value } >
            { props.options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}
