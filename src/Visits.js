import * as React from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import ResourceService from './services';
import { OVERRIDE_DATE, getCurrentDate } from './CurrentDate';
import { getFormData, getFormDataFromEvent } from './utils';
import { activities, getShortActivities } from './jeugddorp';
import { isLocalhost } from './network';

export default class Visits extends React.Component {

  constructor(props) {
    super(props);
    const queryValues = queryString.parse(props.location.search);
    this.state = {
      loading: true,
      date: getCurrentDate(),
      search: '',
      activity: '',
      visits: [],
      isAdmin: queryValues.admin === 'true' || isLocalhost()
    }
  }

  componentDidMount() {
    this.fetchVisits(this.state);
  }

  async fetchVisits({date, search, activity}) {
    this.setState({ loading: true, visits: [] });
    const filter = {
      date
    }
    if (search) {
      filter.name = {
          $regex: search,
          $options: 'i'
      }
    }
    if (activity && activity !== 'all') {
      filter.$or = [
        { activity1: activity },
        { activity2: activity }
      ]
    }
    const visits = await ResourceService.getItems('bezoeken', filter);
    this.setState({ loading: false, visits });
  }

  search(e) {
    const data = getFormDataFromEvent(e);
    this.search3(data);
  }

  search2() {
    const formElement = document.getElementById("filterVisitsForm");
    const data = getFormData(formElement);
    this.search3(data);
  }

  search3(data) {
    const { date, search, activity } = data;
    this.setState({ date, search, activity });
    this.fetchVisits(data);
  }

  render () {
    const { loading, visits, date, search, activity, isAdmin } = this.state;
    //date format 'EEEE d MMMM yyyy'
    return (
    <div className={ OVERRIDE_DATE ? 'override-date' : '' }>
      <div className="col-sm-12 form-group">
        <form id="filterVisitsForm" className="form-inline no-print" noValidate onSubmit={this.search.bind(this)}>
          <label className="control-label" htmlFor="date">Filter:</label>
          <input type="text" className="form-control input-lg" name="date" defaultValue={date}/>
          <input type="text" className="form-control input-lg" name="search" placeholder="naam..." />
          <select className="form-control input-lg" name="activity" onChange={this.search2.bind(this)}>
            <option key="all" value="all">Alles</option>
            { activities.map(activity => (
              <option key={activity.value} value={activity.value}>{activity.label}</option>
            ))}
          </select>
          <button className="btn btn-lg btn-primary" type="submit">Zoeken</button>
        </form>
      </div>
    
{/*      <div ng-if="error" className="col-sm-12 alert alert-danger">{{error}}</div>
      <div ng-show="loading" className="col-sm-12 spinner">laden...</div>
*/}
      { !loading && visits !== undefined && <div>
        <div className="col-sm-12">
          <p>Inschrijvingen voor { date }
            { search && <span>, "{ search }"</span> }
            { activity && <span>, { activity }</span> }
            &nbsp;({ visits.length })
          </p>
        </div>
    
        <div className="col-sm-12 form-group">
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>#</th>
                { isAdmin && <th className="no-print">Tijd</th> }
                <th>Naam</th>
                <th>Tel. 1</th>
                <th>Tel. 2</th>
                <th>Tel. 3</th>
                <th>Ond.</th>
                <th>Opmerkingen</th>
              </tr>
            </thead>
            <tbody>
              { visits.map((visit, index) => {
                const shortActivities = getShortActivities(visit.activity1, visit.activity2);
                return (
                <tr key={ visit._id.$oid }>
                  <td className="fixed">{ index + 1 }</td>
                  { isAdmin && <td className="fixed no-print">{ visit._lastupdated_on}</td> }
                  <td className="fixed">
                    { isAdmin && <span className="no-print">
                      <input type="checkbox" ng-model="bezoek.selected" />&nbsp;
                    </span> }
                    <Link to={"visit/" + visit.kind}>{visit.name}</Link></td>
                  <td className="fixed">{ visit.phone1 }</td>
                  <td className="fixed">{ visit.phone2 }</td>
                  <td className="fixed">{ visit.phone3 }</td>
                  <td className="fixed">{ shortActivities }</td>
                  <td>{ visit.remarks }</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
    
        { isAdmin && <div className="col-sm-12 form-group no-print"> 
          <button type="button" className="btn btn-secondary" ng-click="selectAll()">Selecteer alles</button>
          <button type="button" className="btn btn-secondary" ng-confirm-click="deleteSelected()" ng-confirm-message="Geselecteerde bezoeken verwijderen?">Verwijder geselecteerde bezoeken</button>
        </div> }

      </div> }
    </div>
    );
  }
}