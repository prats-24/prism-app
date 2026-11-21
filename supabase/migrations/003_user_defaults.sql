-- Per-user defaults, created automatically on signup.
create or replace function public.seed_user_defaults(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare wid uuid;
begin
  insert into public.profiles(id) values (uid) on conflict do nothing;
  insert into public.user_settings(user_id) values (uid) on conflict do nothing;

  insert into public.tracks(user_id,slug,name,icon,color,kind,sort) values
    (uid,'dsa','DSA','binary','#547FAF','builtin',1),
    (uid,'ai','AI Engineering','cpu','#8CBCEB','builtin',2),
    (uid,'rl','Reinforcement Learning','route','#547FAF','builtin',3),
    (uid,'scaler','Scaler Academics','graduation-cap','#8CBCEB','builtin',4),
    (uid,'iitm','IIT Madras BS','book-open','#547FAF','builtin',5)
  on conflict do nothing;

  insert into public.habits(user_id,name,icon,category,sort) values
    (uid,'DSA','binary','Learning',1),(uid,'AI learning','cpu','Learning',2),
    (uid,'College study','graduation-cap','Academics',3),(uid,'Gym','dumbbell','Fitness',4),
    (uid,'Reading','book','Growth',5),(uid,'Revision','repeat','Academics',6),
    (uid,'Personal development','sprout','Growth',7);

  insert into public.dsa_weeks(user_id,week_no,title,starts_on,ends_on,dsa_hours,ai_hours,ai_focus,sort) values (uid,1,'Week 1','2026-11-18','2026-11-24',20,2,'Python refresh; Git/GitHub workflow',1) returning id into wid;
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Time Complexity 1 & 2',1);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Big O',2);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Space Complexity & Memory Management',3);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'ArrayList 1 & 2',4);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'2D Arrays',5);
  insert into public.dsa_weeks(user_id,week_no,title,starts_on,ends_on,dsa_hours,ai_hours,ai_focus,sort) values (uid,2,'Week 2','2026-11-25','2026-12-01',20,2,'NumPy orientation: arrays, indexing, vectorised thinking',2) returning id into wid;
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Prefix Sum 1 & 2',1);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Carry Forward',2);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Contribution Technique',3);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Sliding Window',4);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Modular Arithmetic',5);
  insert into public.dsa_weeks(user_id,week_no,title,starts_on,ends_on,dsa_hours,ai_hours,ai_focus,sort) values (uid,3,'Week 3','2026-12-02','2026-12-08',17,5,'NumPy: reshape, broadcasting, vectorisation, matrix operations',3) returning id into wid;
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Interview Problems 1–3',1);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Kadane''s Algorithm',2);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Stocks',3);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Rain Water Trap',4);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Strings 1–3',5);
  insert into public.dsa_weeks(user_id,week_no,title,starts_on,ends_on,dsa_hours,ai_hours,ai_focus,sort) values (uid,4,'Week 4','2026-12-09','2026-12-15',17,5,'PyTorch: tensors, autograd, gradients, nn.Module',4) returning id into wid;
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Recursion 1–4',1);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Fast Power',2);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Tower of Hanoi',3);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Sorting',4);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Binary Search',5);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Two Pointers',6);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Backtracking',7);
  insert into public.dsa_weeks(user_id,week_no,title,starts_on,ends_on,dsa_hours,ai_hours,ai_focus,sort) values (uid,5,'Week 5','2026-12-16','2026-12-22',15,7,'PyTorch training loops, loss, optimisers, Dataset/DataLoader; small neural net',5) returning id into wid;
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Linked Lists',1);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Stacks',2);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Queues',3);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'HashMaps',4);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'HashSets',5);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Trees',6);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'BST',7);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Heaps',8);
  insert into public.dsa_weeks(user_id,week_no,title,starts_on,ends_on,dsa_hours,ai_hours,ai_focus,sort) values (uid,6,'Week 6','2026-12-23','2026-12-29',15,7,'Complete a small PyTorch project and document it',6) returning id into wid;
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Graphs',1);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'BFS',2);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'DFS',3);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'DP basics',4);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Mixed practice',5);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Revision',6);
  insert into public.dsa_topics(user_id,week_id,title,sort) values (uid,wid,'Finish pending labs',7);

  insert into public.rl_progress(user_id,topic_number)
    select uid, number from public.rl_topics on conflict do nothing;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_user_defaults(new.id);
  update public.profiles set display_name = coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)) where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
