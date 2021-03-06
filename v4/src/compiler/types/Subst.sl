import file:./SubstitutableType as SubstitutableType;

import file:../../core/Map as Map;


nullSubst =
    Map.empty
assumptions {
    Map.size (nullSubst) == 0
};


compose s1 s2 =
    Map.union
        (Map.map (SubstitutableType.apply s1) s2)
        s1;


add name type subst =
    Map.insert name type subst;


has name subst =
    Map.contains name subst;


apply name subst =
    Map.findWithDefault () name subst;