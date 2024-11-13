import {Route,Switch} from 'react-router-dom'

import Signup from './components/Signup'
import Login from './components/Login'
import Tasks from './components/Tasks'

import './index.css'

const App=()=>(
        <Switch>
            <Route  exact path="/" component={Signup} />
            <Route  exact path="/login" component={Login} />
            <Route exact path ="/tasks" component={Tasks} />
        </Switch>

        

    
)

export default App