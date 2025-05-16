import { Routes } from '@angular/router';
import { ArriveComponent } from './arrive/arrive.component';
import { MainComponent } from './main/main.component';
import { PostsComponent } from './posts/posts.component';
import { ErrorComponent } from './error/error.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { PostComentsComponent } from './post-coments/post-coments.component';
import { SearchPageComponent } from './search-page/search-page.component';
import { UserGeneralComponent } from './user-general/user-general.component';
import { HashtagPostsComponent } from './hashtag-posts/hashtag-posts.component';
import { EventosComponent } from './eventos/eventos.component';
import { EventoDetalleComponent } from './eventos/evento-detalle/evento-detalle.component';
import { DisplayPequeComponent } from './main/display-peque/display-peque.component';


export const routes: Routes = [
    {
        path: '',
        component: ArriveComponent
    },
    {
        path: 'main',
        component: MainComponent,
        children: [
            {path: 'posts', component: PostsComponent },
            {path: 'big_post/:id', component: PostComentsComponent},
            {path: 'user_info', component: UserProfileComponent},
            {path: 'user_general/:username', component:UserGeneralComponent},
            {path: 'search', component: SearchPageComponent},
            {path: 'hastag_posts/:hashtag', component: HashtagPostsComponent},
            {path: 'events', component: EventosComponent},
            {path: 'big_event/:id', component: EventoDetalleComponent},
            {path: 'extra', component: DisplayPequeComponent}
        ]
    },
    {
        path: '404',
        component: ErrorComponent
    },
    {
        path: '**',
        redirectTo: '404'
    }
];
