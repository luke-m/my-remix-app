import { db } from "./db.server"
import bcrypt from 'bcrypt'
import { createCookieSessionStorage, redirect } from "remix"

const storage = createCookieSessionStorage({
    cookie: {
        name: "RJ_sesh",
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        path: "/",
        maxAge: 60* 60 * 24 * 30,
        httpOnly: true,
    }
})

export const getUserSession = async (req: Request) => {
    const sesh = await storage.getSession(req.headers.get('Cookie'));
    return sesh;
}

export const getUserId = async (req: Request) => {
    const sesh = await getUserSession(req);
    const userId = sesh.get('userId');
    if (!userId || typeof userId !== 'string') {
        return null;
    }
    return userId;
}

export const getUser = async (req: Request) => {
    const userId = await getUserId(req);

    if (!userId) {
        return null;
    }

    const user = await db.user.findFirst({
        where: {
            id: userId
        }
    });

    if (!user) {
        return null;
    }

    return user;
}

export const checkForUser = async (username: string) => {
    const user = await db.user.findFirst({
        where: {
            username
        }
    })

    return user;
}

export const login = async (username: string, password: string) => {
    const user = await checkForUser(username);

    if (!user) return null;
    
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash);

    if (!passwordMatches) {
        return null
    } else {
        return user;
    };
}

export const logout = async (req: Request) => {
    const sesh = await getUserSession(req);
    const header = await storage.destroySession(sesh);
    return redirect('/login', {
        headers: {
            "Set-Cookie": header,
        }
    })
}

export const register = async (username: string, password: string, redirectTo: string) => {
    const user = await db.user.create({
        data: {
            username,
            passwordHash: await bcrypt.hash(password, 10)
        }
    });

    return createUserSession(user.id, redirectTo);
}

export const requireUserId = async (
    req: Request, 
    redirectTo: string = new URL(req.url).pathname
) => {
    const redirectToLogin = () => {
        const searchParams = new URLSearchParams([
            ["redirectTo", redirectTo]
        ]);
        throw redirect(`/login?${searchParams}`);
    }

    const userId = await getUserId(req);

    if (!userId) redirectToLogin();

    // user can be deleted in backend while session still holds his ID
    // -> userId exists but the corresponding user doesn't
    // --> redirect
    const userExists = await db.user.findFirst({
        where: {
            // userId must be a string at this point because otherwise
            // this code wouldn't execute due to the thrown redirect()
            // in redirectToLogin (but TS doesn't know this)
            id: userId as string, 
        }
    })

    if (!userExists) redirectToLogin();

    return userId;
}

export const createUserSession = async (userId: string, redirectTo: string) => {
    const sesh = await storage.getSession();
    sesh.set('userId', userId);
    return redirect(redirectTo, {
        headers: {
            "Set-Cookie": await storage.commitSession(sesh),
        }
    })
}