import * as React from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import ResourceService from './services';
import { OVERRIDE_DATE } from './CurrentDate';

export default class SearchBox extends React.Component {

  constructor(props) {
    super(props);
    this.executeSearch = this.executeSearch.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.debounceSearch = AwesomeDebouncePromise(this.executeSearch, 300);

    const queryValues = queryString.parse(props.location.search);
    this.state = {
      loading: true,
      page: 1,
      pageSize: 10,
      searchText: '',
      matchName: queryValues.matchname,
      matchPhone: queryValues.matchphone,
      items: [],
      itemCount: 0,
      pageCount: 0,
    }
  }

  componentDidMount() {
    this.executeSearch();
  }

  async executeSearch() {
    this.setState({ loading: true, items: [], itemCount: 0, pageCount: 0 });
    const { searchText, matchPhone, page, pageSize } = this.state;
    const filter = {
      name: {
        $regex: searchText,
        $options: 'i'
      }
    }
    if (matchPhone) {
      filter.$or = [
        { phone1: matchPhone },
        { phone2: matchPhone },
        { phone3: matchPhone }
      ]
    }
    const results = await ResourceService.searchItems('kinderen', filter, page, pageSize);
    this.setState({ loading: false, ...results });
  }

  handleTextChange(e) {
    this.setState({ 
        searchText: e.target.value,
        matchPhone: '',
        matchName: ''
      },
      this.debounceSearch
    );
  }

  previousPage() {
    this.setState((state) => {
      return state.page > 1 && { page: state.page - 1 };
    }, this.executeSearch)
  }

  nextPage() {
    this.setState((state) => {
      return state.page <  state.pageCount && { page: state.page + 1 };
    }, this.executeSearch)
  }

  render () {
    const { loading, page, pageSize, items, itemCount, searchText } = this.state;
    return (
      <div className={ OVERRIDE_DATE ? 'override-date' : '' }>
        <div className="col-sm-12 form-group">
          <form className="form-horizontal" noValidate>
            <input type="text" className="form-control input-lg" placeholder="Kind zoeken" onChange={this.handleTextChange} />
          </form>
        </div>

        <div className="col-sm-12 form-group">
          <button className="btn btn-secondary btn-lg" onClick={this.previousPage.bind(this)}>&lt;</button>
          <button className="btn btn-secondary btn-lg" onClick={this.nextPage.bind(this)}>&gt;</button>
          { loading && <span className="spinner">Laden...</span> }
          { !loading && items.length > 0 && <span>{(page - 1) * pageSize + 1} - {(page - 1) * pageSize + items.length} van { itemCount } resultaten</span> }
          { !loading && items.length === 0 && <span>Geen kinderen gevonden</span> }
        </div>

        { !loading && <div className="col-sm-12 form-group">
          <div className="list-group">
            { items.map(item => (
              <Link to={ "/visit/" + item._id.$oid } className="list-group-item" key={ item._id.$oid }>{item.name}</Link>
            ))}
          </div>
        </div> }

        <div className="col-sm-12 form-group">
          <Link to={"/visit/?name=" + searchText} className="btn btn-secondary btn-lg" role="button">Voeg nieuw kind toe</Link>
        </div>
      </div>
    );
  }
}
