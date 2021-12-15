import { ActionFunction, LoaderFunction, redirect } from "remix"
import { logout } from "~/utils/session.server"

export const action: ActionFunction = async ({ request }) => {
    // action function is executed, when route is navigated to
    // with POST request rather than GET request
    // --> logout button is wrapped in form[method=post]
    return logout(request);
}

export const loader: LoaderFunction = async () => {
    // assumption: loader function executes after action function
    // so when using a POST request, this function won't execute
    // because we have a redirect in logout()
    // purpose: if someone directly navigates to /logout, they get
    // redirected to /
    return redirect('/');
}